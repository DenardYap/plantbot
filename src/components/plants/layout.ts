/**
 * Shared layout constants for the plant hero row (video + chat).
 * Both columns must agree on their fixed `lg+` height so the row never
 * collapses or reflows as the chat content changes. The height is also
 * pinned (rather than `lg:h-full`) so it's stable on the first paint —
 * `h-full` resolves async via grid track sizing and was causing a flash
 * during refresh.
 */
export const HERO_ROW_HEIGHT_LG_PX = 640;

/** Pre-baked Tailwind utility string so callers don't hand-write `lg:h-[640px]`. */
export const HERO_ROW_HEIGHT_LG_CLASS = "lg:h-[640px]";
