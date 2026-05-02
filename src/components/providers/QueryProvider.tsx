"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";

export function QueryProvider({ children }: { children: React.ReactNode }) {
  // One client per browser tab. `useState` keeps the same instance across
  // re-renders without leaking caches between unmounts of <RootLayout/>.
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Sensor data updates every 30s on the Pi — show whatever we have
            // immediately, then refetch on focus / reconnect to stay live.
            staleTime: 15_000,
            refetchOnWindowFocus: true,
            refetchOnReconnect: true,
            retry: 1,
          },
          mutations: {
            retry: 0,
          },
        },
      }),
  );

  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}
