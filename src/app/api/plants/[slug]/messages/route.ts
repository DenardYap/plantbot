import { NextResponse } from "next/server";
import {
  insertMessage,
  listMessages,
  listMessagesSince,
  type ChatMessageRecord,
} from "@/lib/chatMessages";
import { getPlantBySlug } from "@/lib/plants";
import { notifyNewMessage, sanitizeMessage } from "@/lib/chatResponder";

export const dynamic = "force-dynamic";

// ---------------------------------------------------------------------------
// Wire types — keep parallel to the file in src/lib/api/types.ts so the
// client doesn't have to know about DB shapes.
// ---------------------------------------------------------------------------

export type ChatMessageDTO = {
  id: number;
  role: "user" | "assistant";
  authorName: string;
  content: string;
  toolCalls: { name: string; status?: string }[] | null;
  createdAt: string;
};

function toDTO(r: ChatMessageRecord): ChatMessageDTO {
  return {
    id: r.id,
    role: r.role,
    authorName: r.authorName,
    content: r.content,
    toolCalls: r.toolCalls,
    createdAt: r.createdAt,
  };
}

function parsePositiveInt(raw: string | null): number | undefined {
  if (!raw) return undefined;
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : undefined;
}

// ---------------------------------------------------------------------------
// GET — paginated history
//
// Two modes:
//   1. `?since=<id>`     → fresh messages strictly newer than `since`.
//                          Returns up to 200 rows oldest → newest.
//                          Used by the live poller.
//   2. `?before=<id>`    → page of older messages (id < before).
//                          Used by the "load older" infinite-scroll trigger.
//                          Omit `before` for the newest page.
// ---------------------------------------------------------------------------

export async function GET(
  req: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const url = new URL(req.url);
  const since = parsePositiveInt(url.searchParams.get("since"));
  const before = parsePositiveInt(url.searchParams.get("before"));
  const limit = parsePositiveInt(url.searchParams.get("limit"));

  try {
    const plant = await getPlantBySlug(slug);
    if (!plant) {
      return NextResponse.json({ error: "Plant not found" }, { status: 404 });
    }

    if (since !== undefined) {
      const fresh = await listMessagesSince(plant.id, since);
      return NextResponse.json({
        messages: fresh.map(toDTO),
        hasMore: false,
        oldestId: null,
      });
    }

    const page = await listMessages({
      plantId: plant.id,
      limit,
      beforeId: before,
    });
    return NextResponse.json({
      messages: page.messages.map(toDTO),
      hasMore: page.hasMore,
      oldestId: page.oldestId,
    });
  } catch (err) {
    console.error(`[/api/plants/${slug}/messages GET] failed:`, err);
    return NextResponse.json(
      { error: "Failed to load messages" },
      { status: 500 },
    );
  }
}

// ---------------------------------------------------------------------------
// POST — append a user message to the room.
//
// The plant's reply does NOT come back in this response. The responder
// loop will append it to the room within ~5 seconds and the client will
// pick it up on the next poll.
// ---------------------------------------------------------------------------

type PostBody = {
  authorName?: string;
  content?: string;
  /**
   * Client-side flag: does the visitor have at least one droplet to spend
   * on watering this turn? Used by the chat agent to refuse `water_plant`
   * tool calls from out-of-droplets visitors. Defaults to `true` if the
   * client doesn't send it (legacy clients).
   */
  wateringAllowed?: boolean;
};

export async function POST(
  req: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;

  let body: PostBody;
  try {
    body = (await req.json()) as PostBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const author = body.authorName?.trim();
  const content = body.content?.trim();
  if (!author || !content) {
    return NextResponse.json(
      { error: "authorName and content are required" },
      { status: 400 },
    );
  }

  const cleanContent = sanitizeMessage(content);
  if (!cleanContent) {
    return NextResponse.json(
      { error: "Message is empty after trimming" },
      { status: 400 },
    );
  }

  try {
    const plant = await getPlantBySlug(slug);
    if (!plant) {
      return NextResponse.json({ error: "Plant not found" }, { status: 404 });
    }

    // Author name is also censored — visitors can't smuggle slurs by
    // dropping them into their display name. Truncated to a sane width.
    const cleanAuthor = sanitizeMessage(author).slice(0, 60) || "Visitor";

    const message = await insertMessage({
      plantId: plant.id,
      role: "user",
      authorName: cleanAuthor,
      content: cleanContent,
      wateringAllowed: body.wateringAllowed ?? true,
    });

    // Kick the responder. Fire-and-forget — POST returns as soon as the
    // user's message is persisted so their bubble appears instantly.
    void notifyNewMessage(slug);

    return NextResponse.json({ message: toDTO(message) }, { status: 201 });
  } catch (err) {
    console.error(`[/api/plants/${slug}/messages POST] failed:`, err);
    return NextResponse.json(
      { error: "Failed to post message" },
      { status: 500 },
    );
  }
}
