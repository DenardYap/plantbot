"use client";

import { useEffect } from "react";
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { randomVisitorName } from "@/lib/visitorNames";

type VisitorState = {
  /**
   * Display name shown in the chat. Picked once on first visit and pinned
   * for the lifetime of this browser (cached in localStorage under
   * `plantbot:visitor`). Empty string until `ensureName()` runs on the
   * client, which keeps SSR and the first client paint in sync.
   */
  name: string;
  /** True once we've confirmed the name is populated client-side. */
  hydrated: boolean;

  /** Idempotent: assigns a name if one isn't already cached. */
  ensureName: () => void;
  /** Re-roll the visitor's display name (and persist it). */
  rerollName: () => void;
};

export const useVisitorStore = create<VisitorState>()(
  persist(
    (set, get) => ({
      name: "",
      hydrated: false,
      ensureName: () => {
        const s = get();
        // Single set() — bundles both fields so subscribers only re-render
        // once, and the persist middleware writes the name to localStorage
        // in the same tick.
        set({
          hydrated: true,
          name: s.name || randomVisitorName(),
        });
      },
      rerollName: () => set({ name: randomVisitorName() }),
    }),
    {
      name: "plantbot:visitor",
      storage: createJSONStorage(() => localStorage),
      // Only the name needs to survive reloads. `hydrated` is a UI-only
      // flag that should always start false on a fresh page load.
      partialize: (s) => ({ name: s.name }),
    },
  ),
);

/**
 * Bootstraps the visitor identity on the client. Safe to call from any
 * mounted component — repeated calls are no-ops once a name is assigned.
 * Use this instead of touching `ensureName` directly so the dependency on
 * being mounted is explicit.
 */
export function useEnsureVisitor(): void {
  useEffect(() => {
    useVisitorStore.getState().ensureName();
  }, []);
}
