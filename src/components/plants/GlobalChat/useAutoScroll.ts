"use client";

import { useCallback, useEffect, useRef } from "react";

/**
 * Chat auto-scroll heuristic:
 *
 *   - When the user is "near the bottom" (within ~80px of the floor) and
 *     `scrollKey` changes, smoothly scroll them to the new floor.
 *   - When the user has deliberately scrolled up to read older messages,
 *     leave their viewport alone.
 *
 * Callers compose `scrollKey` as a stable string that changes whenever a
 * scroll should be re-evaluated (e.g. `${messageCount}:${isThinkingFlag}`).
 * We deliberately take a single scalar instead of a deps array so eslint's
 * `react-hooks/exhaustive-deps` rule can analyse it statically.
 */
const STICK_THRESHOLD_PX = 80;

export function useAutoScroll<T extends HTMLElement>(scrollKey: string | number) {
  const ref = useRef<T>(null);

  // Track whether the user is currently near the bottom. Kept in a ref so
  // we don't re-render on every scroll event.
  const stuckToBottom = useRef(true);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const onScroll = () => {
      const distance = el.scrollHeight - el.clientHeight - el.scrollTop;
      stuckToBottom.current = distance <= STICK_THRESHOLD_PX;
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (!stuckToBottom.current) return;
    el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [scrollKey]);

  const scrollToBottom = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
    stuckToBottom.current = true;
  }, []);

  return { ref, scrollToBottom };
}
