"use client";
import React, { useEffect, useRef, useState } from "react";

/**
 * Mounts children only when scrolled near the viewport. Rendering five
 * ApexCharts at once blocks a phone's main thread for seconds and taps
 * (like the sidebar hamburger) queue behind it — so charts below the fold
 * wait their turn instead.
 */
export default function LazyMount({
  height, children,
}: { height: number; children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [show, setShow] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") {
      setShow(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setShow(true);
          io.disconnect();
        }
      },
      { rootMargin: "250px" },
    );
    io.observe(el);
    // Safety net: whatever happens with the observer, mount once the busy
    // first seconds are over — a chart must never be permanently missing.
    const t = setTimeout(() => setShow(true), 3000);
    return () => { io.disconnect(); clearTimeout(t); };
  }, []);

  return (
    <div ref={ref} style={show ? undefined : { minHeight: height }}>
      {show ? children : null}
    </div>
  );
}
