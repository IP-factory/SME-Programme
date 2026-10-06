import { useEffect, useRef, useState } from "react";
import { BRAND } from "@shared/brand";

declare global {
  interface Window {
    instgrm?: {
      Embeds?: {
        process: () => void;
      };
    };
  }
}

const INSTAGRAM_REEL_URL = BRAND.facilitatorInstagramReelUrl;
const INSTAGRAM_EMBED_SCRIPT_ID = "instagram-embed-script";
const DEFAULT_FACILITATOR_POSTER = BRAND.facilitatorPortraitUrl;

type FacilitatorVideoProps = {
  mp4Url?: string;
  posterUrl?: string;
};

export default function FacilitatorVideo({ mp4Url, posterUrl }: FacilitatorVideoProps) {
  const sectionRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: "160px 0px", threshold: 0.1 },
    );

    observer.observe(section);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!isVisible || mp4Url) return;

    const existingScript = document.getElementById(INSTAGRAM_EMBED_SCRIPT_ID) as HTMLScriptElement | null;
    if (existingScript) {
      window.instgrm?.Embeds?.process();
      return;
    }

    const script = document.createElement("script");
    script.id = INSTAGRAM_EMBED_SCRIPT_ID;
    script.src = "https://www.instagram.com/embed.js";
    script.async = true;
    script.onload = () => window.instgrm?.Embeds?.process();
    document.body.appendChild(script);
  }, [isVisible, mp4Url]);

  return (
    <figure ref={sectionRef} className="w-full md:max-w-[380px]">
      {mp4Url ? (
        <video
          className="aspect-[9/16] w-full bg-ink object-cover"
          controls
          playsInline
          preload="metadata"
          poster={posterUrl ?? DEFAULT_FACILITATOR_POSTER}
          src={mp4Url}
        >
          Your browser does not support embedded video.
        </video>
      ) : isVisible ? (
        <div className="aspect-[9/16] w-full overflow-hidden bg-paper-sunken">
          <blockquote
            className="instagram-media"
            data-instgrm-captioned
            data-instgrm-permalink={INSTAGRAM_REEL_URL}
            data-instgrm-version="14"
            style={{ background: "#FFF", border: 0, margin: "1px", maxWidth: "380px", minWidth: 0, padding: 0, width: "calc(100% - 2px)" }}
          >
            <a href={INSTAGRAM_REEL_URL} target="_blank" rel="noreferrer">
              View {BRAND.facilitatorFormalName} on Instagram
            </a>
          </blockquote>
        </div>
      ) : (
        <div className="aspect-[9/16] w-full bg-paper-sunken border border-line flex items-center justify-center text-center px-8">
          <p className="text-xs uppercase tracking-[0.18em] text-ink-muted">Loading facilitator video</p>
        </div>
      )}
      <figcaption className="mt-3 text-center text-xs uppercase tracking-[0.14em] text-ink-muted">
        {BRAND.facilitatorFormalName} on {BRAND.programmeName}
      </figcaption>
    </figure>
  );
}
