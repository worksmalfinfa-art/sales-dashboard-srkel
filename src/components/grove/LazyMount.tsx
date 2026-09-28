"use client";
import React, { useEffect, useRef, useState } from "react";

/**
 * Mounts children only when scrolled near the viewport. Rendering five
 * ApexCharts at once blocks a phone's main thread for seconds and taps
 * (like the sidebar hamburger) queue behind it — so charts below the fold
 * wait their turn instead.
 *
 * It also OWNS the chart width. ApexCharts' internal resize observers
 * compare fractional measurements and can disagree with themselves at
 * non-integer devicePixelRatio (Windows 125% scaling), redrawing the chart
 * over and over — the tooltip-blink bug. Charts therefore render with an
 * explicit integer width from here (function children receive it), Apex's
 * own observers stay off, and a redraw can only happen when the rounded
 * width really moves by ≥2px.
 */
export default function LazyMount({
  height, children,
}: {
  height: number;
  children: React.ReactNode | ((width: number) => React.ReactNode);
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [show, setShow] = useState(false);
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) { setShow(true); return; }

    const measure = () => {
      const nw = Math.round(el.getBoundingClientRect().width);
      if (nw > 0) setWidth((prev) => (Math.abs(nw - prev) >= 2 ? nw : prev));
    };
    measure();

    let ro: ResizeObserver | null = null;
    if (typeof ResizeObserver !== "undefined") {
      ro = new ResizeObserver(measure);
      ro.observe(el);
    }

    if (typeof IntersectionObserver === "undefined") {
      setShow(true);
      return () => ro?.disconnect();
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
    return () => { io.disconnect(); ro?.disconnect(); clearTimeout(t); };
  }, []);

  const content =
    typeof children === "function"
      ? (width > 0 ? children(width) : null)
      : children;

  return (
    <div ref={ref} style={show ? undefined : { minHeight: height }}>
      {show ? content : null}
    </div>
  );
}
