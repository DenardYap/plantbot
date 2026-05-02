"use client";

import { useEffect, useRef, useState } from "react";
import { match } from "ts-pattern";
import { SendIcon, ToolIcon } from "@/components/icons";
import { Card, Eyebrow, IconButton, Pill } from "@/components/ui";
import { useChatMutation } from "@/lib/api/hooks";
import type { ChatMessage as WireMessage } from "@/lib/api/types";

type LocalRole = "user" | "plant" | "system";
type LocalMessage = {
  id: string;
  role: LocalRole;
  author: string;
  text: string;
  at: Date;
  toolCalls?: { name: string }[];
};

const greetingMessage = (plantName: string): LocalMessage => ({
  id: "greet",
  role: "plant",
  author: plantName,
  text: `Hi! I'm ${plantName}. Ask me how I'm doing — I can check my own humidity, temperature, and soil moisture sensors.`,
  at: new Date(),
});

const systemMessage = (plantName: string): LocalMessage => ({
  id: "sys",
  role: "system",
  author: "PlantBot",
  text: `You're chatting with ${plantName}.`,
  at: new Date(),
});

function formatTime(d: Date): string {
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function toolLabel(name: string): string {
  return match(name)
    .with("check_temperature", () => "checked temperature")
    .with("check_humidity", () => "checked humidity")
    .with("check_soil_moisture", () => "checked soil moisture")
    .otherwise(() => name);
}

export function GlobalChat({
  slug,
  plantName,
}: {
  slug: string;
  plantName: string;
}) {
  const [messages, setMessages] = useState<LocalMessage[]>(() => [
    systemMessage(plantName),
    greetingMessage(plantName),
  ]);
  const [draft, setDraft] = useState("");
  const listRef = useRef<HTMLOListElement>(null);
  const chat = useChatMutation(slug);

  useEffect(() => {
    listRef.current?.scrollTo({
      top: listRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, chat.isPending]);

  const send = async () => {
    const text = draft.trim();
    if (!text || chat.isPending) return;

    const userMsg: LocalMessage = {
      id: `u-${Date.now()}`,
      role: "user",
      author: "you",
      text,
      at: new Date(),
    };
    const nextMessages = [...messages, userMsg];
    setMessages(nextMessages);
    setDraft("");

    // Build wire history from the conversation. Skip the local greeting +
    // system message — the server has its own system prompt.
    const wireHistory: WireMessage[] = nextMessages
      .filter((m) => m.role === "user" || m.role === "plant")
      .filter((m) => m.id !== "greet")
      .map((m) => ({
        role: m.role === "plant" ? "assistant" : "user",
        content: m.text,
      }));

    try {
      const res = await chat.mutateAsync(wireHistory);
      setMessages((m) => [
        ...m,
        {
          id: `p-${Date.now()}`,
          role: "plant",
          author: plantName,
          text: res.reply,
          at: new Date(),
          toolCalls: res.toolCalls,
        },
      ]);
    } catch (err) {
      const detail = err instanceof Error ? err.message : "Unknown error";
      setMessages((m) => [
        ...m,
        {
          id: `e-${Date.now()}`,
          role: "system",
          author: "PlantBot",
          text: `Couldn't reach the agent: ${detail}`,
          at: new Date(),
        },
      ]);
    }
  };

  return (
    <Card className="flex h-[520px] max-h-[80vh] flex-col lg:h-full lg:max-h-[640px]">
      <header className="flex items-center justify-between border-b border-border px-5 py-4">
        <div>
          <Eyebrow>Chat with the plant</Eyebrow>
          <div className="text-base font-extrabold text-ink">
            #{plantName.toLowerCase().replace(/\s+/g, "-")}
          </div>
        </div>
        <Pill tone="brand">Live agent</Pill>
      </header>

      <ol
        ref={listRef}
        className="flex-1 space-y-4 overflow-y-auto px-5 py-4"
        aria-live="polite"
      >
        {messages.map((m) => (
          <li
            key={m.id}
            className={
              m.role === "system"
                ? "flex flex-col gap-1"
                : m.role === "user"
                  ? "flex flex-row-reverse gap-3"
                  : "flex gap-3"
            }
          >
            {m.role === "system" ? (
              <p className="text-center text-xs text-ink-subtle">{m.text}</p>
            ) : (
              <>
                {m.role === "plant" && (
                  <div className="shrink-0 pt-0.5">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img 
                      src="/persona-2-terracotta.svg" 
                      alt={`${plantName} avatar`} 
                      className="h-8 w-8 rounded-full bg-surface-sunken p-1"
                    />
                  </div>
                )}
                <div
                  className={`flex flex-col gap-1 flex-1 ${
                    m.role === "user" ? "items-end" : ""
                  }`}
                >
                  <div
                    className={`flex items-baseline gap-2 ${
                      m.role === "user" ? "flex-row-reverse" : ""
                    }`}
                  >
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
                  {m.toolCalls && m.toolCalls.length > 0 && (
                    <ul
                      className={`flex flex-wrap gap-1.5 ${
                        m.role === "user" ? "justify-end" : ""
                      }`}
                    >
                      {m.toolCalls.map((tc, i) => (
                        <li key={i}>
                          <Pill tone="neutral" size="sm">
                            <ToolIcon className="h-3 w-3" aria-hidden />
                            {toolLabel(tc.name)}
                          </Pill>
                        </li>
                      ))}
                    </ul>
                  )}
                  <p
                    className={`text-sm text-ink ${
                      m.role === "user" ? "text-right" : ""
                    }`}
                  >
                    {m.text}
                  </p>
                </div>
              </>
            )}
          </li>
        ))}
        {chat.isPending && (
          <li className="flex gap-3">
            <div className="shrink-0 pt-0.5">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img 
                src="/persona-2-terracotta.svg" 
                alt={`${plantName} avatar`} 
                className="h-8 w-8 rounded-full bg-surface-sunken p-1 opacity-50"
              />
            </div>
            <div className="flex flex-col gap-1 flex-1 justify-center">
              <div className="flex items-center gap-2 text-xs text-ink-subtle">
                <span className="inline-flex gap-0.5" aria-hidden>
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-ink-subtle" />
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-ink-subtle [animation-delay:120ms]" />
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-ink-subtle [animation-delay:240ms]" />
                </span>
                <span>{plantName} is thinking…</span>
              </div>
            </div>
          </li>
        )}
      </ol>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          void send();
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
          placeholder={`Ask ${plantName} how it's doing…`}
          disabled={chat.isPending}
          className="flex-1 rounded-full bg-surface-sunken px-4 py-2.5 text-sm font-medium text-ink placeholder:text-ink-subtle focus:outline-none focus:ring-2 focus:ring-brand disabled:opacity-60"
        />
        <IconButton
          type="submit"
          aria-label="Send message"
          disabled={!draft.trim() || chat.isPending}
        >
          <SendIcon className="h-4 w-4" aria-hidden />
        </IconButton>
      </form>
    </Card>
  );
}
