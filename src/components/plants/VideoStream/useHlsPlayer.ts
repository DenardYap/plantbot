"use client";
import Hls from "hls.js";
import { useEffect, useRef, useState } from "react";

export type PlayerStatus = "connecting" | "live" | "error";

export function useHlsPlayer(src: string) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [status, setStatus] = useState<PlayerStatus>("connecting");

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // Safari (and iOS) support HLS natively via the <video> element.
    if (video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = src;
      const onPlaying = () => setStatus("live");
      const onError = () => setStatus("error");
      video.addEventListener("playing", onPlaying);
      video.addEventListener("error", onError);
      return () => {
        video.removeEventListener("playing", onPlaying);
        video.removeEventListener("error", onError);
      };
    }

    // All other browsers — use hls.js via MSE.
    if (Hls.isSupported()) {
      const hls = new Hls({ lowLatencyMode: true });
      hls.loadSource(src);
      hls.attachMedia(video);
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        video.play().catch(() => {
          // Autoplay blocked by the browser — the user can tap to play.
        });
      });
      // Only mark live once the first segment has actually loaded.
      hls.on(Hls.Events.FRAG_LOADED, () => setStatus("live"));
      hls.on(Hls.Events.ERROR, (_, data) => {
        if (data.fatal) setStatus("error");
      });
      return () => hls.destroy();
    }

    // Browser supports neither native HLS nor MSE — treat as error.
    setStatus("error");
  }, [src]);

  return { videoRef, status };
}
