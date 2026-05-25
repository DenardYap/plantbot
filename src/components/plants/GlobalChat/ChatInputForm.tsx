"use client";

import { useState } from "react";
import { SendIcon } from "@/components/icons";
import { IconButton } from "@/components/ui";

export function ChatInputForm({
  plantName,
  visitorName,
  disabled,
  onSend,
}: {
  plantName: string;
  visitorName: string;
  disabled: boolean;
  onSend: (text: string) => void | Promise<void>;
}) {
  const [draft, setDraft] = useState("");
  const canSubmit = draft.trim().length > 0 && !disabled;

  const submit = () => {
    if (!canSubmit) return;
    const text = draft.trim();
    setDraft("");
    void onSend(text);
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
      className="flex items-center gap-2 border-t border-border p-3"
    >
      <label htmlFor="chat-input" className="sr-only">
        Message {plantName} as {visitorName}
      </label>
      <input
        id="chat-input"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        placeholder={
          visitorName
            ? `Chat as ${visitorName}…`
            : `Ask ${plantName} how it's doing…`
        }
        disabled={disabled}
        maxLength={1000}
        // text-base (16px) on mobile so iOS Safari doesn't auto-zoom into the
        // input when it focuses; can drop back to sm on larger screens.
        className="min-w-0 flex-1 rounded-full bg-surface-sunken px-4 py-2.5 text-base font-medium text-ink placeholder:text-ink-subtle focus:outline-none focus:ring-2 focus:ring-brand disabled:opacity-60 sm:text-sm"
      />
      <IconButton
        type="submit"
        aria-label="Send message"
        disabled={!canSubmit}
      >
        <SendIcon className="h-4 w-4" aria-hidden />
      </IconButton>
    </form>
  );
}
