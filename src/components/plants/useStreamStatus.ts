"use client";
import { useQuery } from "@tanstack/react-query";

export type StreamStatus = "loading" | "live" | "offline";

/**
 * Polls the HLS playlist and returns whether the stream is actually live.
 *
 * A plain HEAD on the .m3u8 is not enough: the playlist file usually
 * sticks around on the origin (or in a CDN cache) after the encoder dies,
 * so "the file exists" is a poor proxy for "the camera is streaming".
 *
 * We GET the playlist body and treat the stream as live only if:
 *   - the response is OK,
 *   - it does NOT contain #EXT-X-ENDLIST (which marks a finished VOD),
 *   - and the playlist was updated recently enough that the encoder must
 *     still be writing new segments. "Recently" is derived from the last
 *     #EXT-X-PROGRAM-DATE-TIME tag if present, otherwise the Last-Modified
 *     response header.
 */
export function useStreamStatus(streamUrl: string | undefined): StreamStatus {
  const { data, isLoading } = useQuery({
    queryKey: ["stream-status", streamUrl],
    enabled: Boolean(streamUrl),
    queryFn: async () => {
      if (!streamUrl) return false;
      const res = await fetch(streamUrl, { cache: "no-store" });
      if (!res.ok) return false;
      const text = await res.text();
      return isPlaylistLive(text, res.headers.get("last-modified"));
    },
    // Poll often enough that the badge flips within ~10s of the camera dying,
    // but not so often that we hammer the origin.
    refetchInterval: 8_000,
    refetchIntervalInBackground: false,
    staleTime: 4_000,
    retry: 1,
  });

  if (!streamUrl) return "offline";
  if (isLoading) return "loading";
  return data ? "live" : "offline";
}

// How stale the most recent segment can be before we call the stream dead.
// ffmpeg's default segment time is ~6s; 20s gives ~3 segments of slack.
const LIVE_THRESHOLD_MS = 20_000;

function isPlaylistLive(
  text: string,
  lastModifiedHeader: string | null,
): boolean {
  // Explicit "this stream is over" marker from the encoder.
  if (text.includes("#EXT-X-ENDLIST")) return false;

  const now = Date.now();

  // Prefer the encoder-stamped timestamp on the most recent segment.
  // ffmpeg emits one #EXT-X-PROGRAM-DATE-TIME per segment by default.
  const pdtMatches = [...text.matchAll(/#EXT-X-PROGRAM-DATE-TIME:(\S+)/g)];
  if (pdtMatches.length > 0) {
    const lastPdt = pdtMatches[pdtMatches.length - 1][1];
    const segmentStart = new Date(lastPdt).getTime();
    if (!Number.isNaN(segmentStart)) {
      // Add the segment's own duration so we measure age from when the
      // segment FINISHED, not when it started.
      const extinfMatches = [...text.matchAll(/#EXTINF:([\d.]+)/g)];
      const lastSegDurMs =
        extinfMatches.length > 0
          ? Number(extinfMatches[extinfMatches.length - 1][1]) * 1000
          : 0;
      return now - segmentStart - lastSegDurMs < LIVE_THRESHOLD_MS;
    }
  }

  // Fallback: the playlist itself is rewritten every segment duration on a
  // live stream, so its Last-Modified is a decent freshness proxy.
  if (lastModifiedHeader) {
    const lmTime = new Date(lastModifiedHeader).getTime();
    if (!Number.isNaN(lmTime)) {
      return now - lmTime < LIVE_THRESHOLD_MS;
    }
  }

  // No timing info available — be conservative and assume live since the
  // file is at least reachable.
  return true;
}
