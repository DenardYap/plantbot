"use client";

import { useEffect, useRef, useState } from "react";
import { SendIcon } from "@/components/icons";
import { Card, Eyebrow, IconButton } from "@/components/ui";

type Role = "user" | "plant" | "system";
type Message = {
  id: string;
  role: Role;
  author: string;
  text: string;
  at: Date;
};

const seedMessages = (plantName: string): Message[] => [
  {
    id: "m1",
    role: "system",
    author: "PlantBot",
    text: `You joined the chat with ${plantName}.`,
    at: new Date(Date.now() - 1000 * 60 * 12),
  },
  {
    id: "m2",
    role: "user",
    author: "mira",
    text: "are you thirsty today?",
    at: new Date(Date.now() - 1000 * 60 * 8),
  },
  {
    id: "m3",
    role: "plant",
    author: plantName,
    text: "Soil is at 46%. I could go another day, but a little sip wouldn't hurt.",
    at: new Date(Date.now() - 1000 * 60 * 7.5),
  },
  {
    id: "m4",
    role: "user",
    author: "ravi",
    text: "sun looks good from the cam",
    at: new Date(Date.now() - 1000 * 60 * 3),
  },
];

function formatTime(d: Date): string {
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export function GlobalChat({ plantName }: { plantName: string }) {
  const [messages, setMessages] = useState<Message[]>(() =>
    seedMessages(plantName),
  );
  const [draft, setDraft] = useState("");
  const listRef = useRef<HTMLOListElement>(null);

  useEffect(() => {
    listRef.current?.scrollTo({
      top: listRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages]);

  const send = () => {
    const text = draft.trim();
    if (!text) return;
    setMessages((m) => [
      ...m,
      {
        id: `u-${m.length}`,
        role: "user",
        author: "you",
        text,
        at: new Date(),
      },
    ]);
    setDraft("");
  };

  return (
    <Card className="flex h-full min-h-[420px] flex-col">
      <header className="flex items-center justify-between border-b border-border px-5 py-4">
        <div>
          <Eyebrow>Global chat</Eyebrow>
          <div className="text-base font-extrabold text-ink">
            #{plantName.toLowerCase()}
          </div>
        </div>
        <div className="text-xs font-bold text-ink-muted">
          {messages.filter((m) => m.role === "user").length} in room
        </div>
      </header>

      <ol
        ref={listRef}
        className="flex-1 space-y-4 overflow-y-auto px-5 py-4"
        aria-live="polite"
      >
        {messages.map((m) => (
          <li key={m.id} className="flex flex-col gap-1">
            {m.role === "system" ? (
              <p className="text-center text-xs text-ink-subtle">{m.text}</p>
            ) : (
              <>
                <div className="flex items-baseline gap-2">
                  <span
                    className={[
                      "text-sm font-extrabold",
                      m.role === "plant" ? "text-brand" : "text-ink",
                    ].join(" ")}
                  >
                    {m.author}
                  </span>
                  <span className="text-xs text-ink-subtle">
                    {formatTime(m.at)}
                  </span>
                </div>
                <p className="text-sm text-ink">{m.text}</p>
              </>
            )}
          </li>
        ))}
      </ol>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          send();
        }}
        className="flex items-center gap-2 border-t border-border p-3"
      >
        <label htmlFor="chat-input" className="sr-only">
          Message {plantName}
        </label>
        <input
          id="chat-input"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder={`Say hi to ${plantName}…`}
          className="flex-1 rounded-full bg-surface-sunken px-4 py-2.5 text-sm font-medium text-ink placeholder:text-ink-subtle focus:outline-none focus:ring-2 focus:ring-brand"
        />
        <IconButton
          type="submit"
          aria-label="Send message"
          disabled={!draft.trim()}
        >
          <SendIcon className="h-4 w-4" aria-hidden />
        </IconButton>
      </form>
    </Card>
  );
}
