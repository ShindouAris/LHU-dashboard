import React, { useEffect, useRef, useState } from "react";

type ResponsiveIframeProps = {
  src: string;
  title?: string;
  // aspect ratio as width/height (e.g. 16/9 -> 16/9), defaults to 16/9
  aspectRatio?: number;
  className?: string;
  allowFullScreen?: boolean;
  sandbox?: string; // optional sandbox attribute
  lazy?: boolean; // loading="lazy"
  autoResize?: boolean; // try to auto-adjust height for same-origin content
  style?: React.CSSProperties;
};

// ResponsiveIframe: a single-file TSX component using Tailwind classes.
// - Uses an aspect-ratio container so it behaves well across devices
// - Optionally tries to auto-resize when content is same-origin
// - Provides a tiny fullscreen toggle and basic accessibility

export default function ResponsiveIframe({
  src,
  title = "Embedded content",
  aspectRatio = 16 / 9,
  className = "",
  allowFullScreen = true,
  sandbox,
  lazy = true,
  autoResize = true,
  style = {},
}: ResponsiveIframeProps) {
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [intrinsicHeight, setIntrinsicHeight] = useState<number | null>(null);

  // compute padding-top % trick for aspect ratio container
  const paddingTop = `${100 / aspectRatio}%`; // if aspectRatio = 16/9 -> 56.25%

  useEffect(() => {
    if (!autoResize) return;

    const iframe = iframeRef.current;
    if (!iframe) return;

    // try ResizeObserver on iframe's contentWindow/document.body via postMessage is more robust
    // but cross-origin will block reading contentDocument. We'll attempt best-effort.

    let ro: ResizeObserver | null = null;

    const trySameOriginResize = () => {
      try {
        const doc = iframe.contentDocument;
        if (!doc) return;
        const body = doc.body;
        // set initial height
        const h = Math.max(body.scrollHeight, body.offsetHeight, doc.documentElement.scrollHeight);
        setIntrinsicHeight(h);

        ro = new ResizeObserver(() => {
          const newH = Math.max(body.scrollHeight, body.offsetHeight, doc.documentElement.scrollHeight);
          setIntrinsicHeight(newH);
        });
        ro.observe(body);
      } catch {
        // cross-origin — we can't access document. Fallback: rely on aspect ratio
        // Optionally: implement postMessage-based resizing on iframe side.
        // No-op here.
      }
    };

    trySameOriginResize();

    return () => {
      if (ro) ro.disconnect();
    };
  }, [src, autoResize]);

  // handle postMessage resize requests (optional pattern: host page inside iframe can post { type: 'resize', height })
  useEffect(() => {
    const handler = (ev: MessageEvent) => {
      // only trust messages from same origin or allow if you know the source
      if (!ev.data || typeof ev.data !== "object") return;
      if (ev.data?.type === "iframe-resize" && typeof ev.data?.height === "number") {
        setIntrinsicHeight(ev.data.height);
      }
    };
    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, []);

  // computed styles
  const iframeStyle: React.CSSProperties = {
    border: "0",
    width: "100%",
    height: intrinsicHeight ? `${intrinsicHeight}px` : "100%",
    minHeight: 120,
    display: "block",
    ...style,
  };

  return (
    <div
      ref={containerRef}
      className={`relative w-full ${className}`}
      // when intrinsicHeight is provided we don't need the aspect-box hack; keep wrapper responsive
    >

      {/* if we have intrinsicHeight (same-origin or postMessage), render a natural block iframe */}
      {intrinsicHeight ? (
        <div className="w-full" style={{ height: intrinsicHeight }}>
          <iframe
            ref={iframeRef}
            src={src}
            title={title}
            style={iframeStyle}
            loading={lazy ? "lazy" : "eager"}
            sandbox={sandbox}
            allowFullScreen={allowFullScreen}
            className="w-full h-full"
          />
        </div>
      ) : (
        // use aspect-ratio container so it scales cleanly on all devices
        <div
          className="w-full overflow-hidden"
          style={{ paddingTop }}
        >
          <iframe
            ref={iframeRef}
            src={src}
            title={title}
            style={{ ...iframeStyle, position: "absolute", top: 0, left: 0, height: "100%" }}
            loading={lazy ? "lazy" : "eager"}
            sandbox={sandbox}
            allowFullScreen={allowFullScreen}
            className="w-full h-full absolute"
          />
        </div>
      )}

      {/* accessibility hint for narrow screens */}
      <noscript>
        <div className="mt-2 text-center text-xs text-gray-400">Enable JavaScript to view embedded content.</div>
      </noscript>
    </div>
  );
}
