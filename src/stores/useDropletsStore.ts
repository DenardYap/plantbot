"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export const DAILY_DROPLETS = 5;

// YYYY-MM-DD in the user's local timezone. Day-roll is a perceived,
// human concept — UTC dates would surprise users near midnight.
function localDayKey(d: Date = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

type DropletsState = {
  count: number;
  // Local day (YYYY-MM-DD) the count was last refilled / reset for.
  dayKey: string;
  // `true` once the persisted state has rehydrated from localStorage.
  // Until then, consumers should treat values as "unknown" to avoid an
  // SSR/CSR flash of the default-5 state before the real value loads.
  hydrated: boolean;

  // Returns the count, refilling first if the calendar day has changed.
  // Components should call this in an effect or via the selector
  // `useDroplets()` so re-renders are triggered on refill.
  refillIfNewDay: () => void;
  useDroplet: () => boolean;
};

export const useDropletsStore = create<DropletsState>()(
  persist(
    (set, get) => ({
      count: DAILY_DROPLETS,
      dayKey: localDayKey(),
      hydrated: false,

      refillIfNewDay: () => {
        const today = localDayKey();
        if (get().dayKey !== today) {
          set({ count: DAILY_DROPLETS, dayKey: today });
        }
      },

      useDroplet: () => {
        // Spend a droplet, refilling first if it's a new day. Returns
        // `true` if the spend succeeded, `false` if the user is empty.
        const today = localDayKey();
        const state = get();
        const baseCount = state.dayKey === today ? state.count : DAILY_DROPLETS;
        if (baseCount <= 0) {
          if (state.dayKey !== today) {
            set({ count: DAILY_DROPLETS, dayKey: today });
          }
          return false;
        }
        set({ count: baseCount - 1, dayKey: today });
        return true;
      },
    }),
    {
      name: "plantbot:droplets",
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({ count: s.count, dayKey: s.dayKey }),
      onRehydrateStorage: () => (state) => {
        // After rehydration, perform a one-shot refill check so users
        // who left the tab open overnight see today's allowance.
        if (state) {
          const today = localDayKey();
          if (state.dayKey !== today) {
            state.count = DAILY_DROPLETS;
            state.dayKey = today;
          }
          state.hydrated = true;
        }
      },
    },
  ),
);
