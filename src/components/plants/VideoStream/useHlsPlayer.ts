"use client";
import { useEffect, useRef, useState } from "react";

export type PlayerStatus = "connecting" | "live" | "error";

export function useHlsPlayer(src: string | null) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [status, setStatus] = useState<PlayerStatus>("connecting");

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    // No source means the caller has decided the stream is offline —
    // bail out and reset so the next "live" transition starts clean.
    if (!src) {
      setStatus("connecting");
      return;
    }

    let cancelled = false;
    const cleanups: Array<() => void> = [];

    function onPlaying() {
      if (!cancelled) setStatus("live");
    }
    function onVideoError() {
      if (!cancelled) setStatus("error");
    }

    if (video.canPlayType("application/vnd.apple.mpegurl")) {
      // Safari supports HLS natively — attach src directly and listen for playback.
      video.src = src;
      video.addEventListener("playing", onPlaying);
      video.addEventListener("error", onVideoError);
      video.play().catch(() => {});
      cleanups.push(() => {
        video.removeEventListener("playing", onPlaying);
        video.removeEventListener("error", onVideoError);
        video.removeAttribute("src");
        video.load();
      });
    } else {
      // Dynamic import avoids evaluating hls.js during SSR, where it would
      // touch browser globals (window, document) and silently break.
      import("hls.js")
        .then(({ default: Hls }) => {
          if (cancelled) return;
          if (!Hls.isSupported()) {
            setStatus("error");
            return;
          }

          const hls = new Hls();
          video.addEventListener("playing", onPlaying);
          hls.loadSource(src);
          hls.attachMedia(video);
          hls.on(Hls.Events.MANIFEST_PARSED, () => {
            if (!cancelled) video.play().catch(() => {});
          });
          hls.on(Hls.Events.ERROR, (_, data) => {
            if (data.fatal && !cancelled) setStatus("error");
          });

          cleanups.push(() => {
            video.removeEventListener("playing", onPlaying);
            hls.destroy();
          });
        })
        .catch(() => {
          if (!cancelled) setStatus("error");
        });
    }

    return () => {
      cancelled = true;
      cleanups.forEach((fn) => fn());
    };
  }, [src]);

  return { videoRef, status };
}
