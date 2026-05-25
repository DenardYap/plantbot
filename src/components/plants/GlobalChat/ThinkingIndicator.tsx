export function ThinkingIndicator({
  plantName,
  plantProfileImageUrl,
}: {
  plantName: string;
  plantProfileImageUrl: string | null;
}) {
  return (
    <li className="flex gap-3">
      <div className="shrink-0 pt-0.5">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={plantProfileImageUrl ?? "/persona-2-terracotta.svg"}
          alt={`${plantName} avatar`}
          className="h-8 w-8 rounded-full bg-surface-sunken object-cover p-0.5 opacity-60"
        />
      </div>
      <div className="flex flex-1 flex-col gap-1 justify-center">
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
  );
}
