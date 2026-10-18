"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

// Small interactive effects for the /reps and /fractional-cro landing pages.
// Each one degrades to plain static content without JS or with
// reduced-motion enabled (see the .lp-* rules in globals.css).

/** Fires once when the element first scrolls into view. */
function useInView<T extends Element>(threshold = 0.3) {
  const ref = useRef<T>(null);
  const [seen, setSeen] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setSeen(true);
          io.disconnect();
        }
      },
      { threshold },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [threshold]);
  return [ref, seen] as const;
}

/** Card whose border/background glows where the cursor is. */
export function Spotlight({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  return (
    <div
      ref={ref}
      onPointerMove={(e) => {
        const el = ref.current;
        if (!el) return;
        const r = el.getBoundingClientRect();
        el.style.setProperty("--mx", `${e.clientX - r.left}px`);
        el.style.setProperty("--my", `${e.clientY - r.top}px`);
      }}
      className={`lp-spot ${className}`}
    >
      {children}
    </div>
  );
}

/** A statement line that brightens from dim to full as it enters view. */
export function LightLine({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const [ref, seen] = useInView<HTMLParagraphElement>(0.9);
  return (
    <p ref={ref} className={`lp-line ${seen ? "is-visible" : ""} ${className}`}>
      {children}
    </p>
  );
}

/** Counts from 0 to `to` the first time it's seen. */
export function CountUp({
  to,
  prefix = "",
  suffix = "",
  duration = 1600,
}: {
  to: number;
  prefix?: string;
  suffix?: string;
  duration?: number;
}) {
  const [ref, seen] = useInView<HTMLSpanElement>(0.6);
  const [n, setN] = useState(to);
  useEffect(() => {
    if (!seen) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let raf = 0;
    const start = performance.now();
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / duration);
      setN(Math.round(to * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [seen, to, duration]);
  return (
    <span ref={ref} className="tabular-nums">
      {prefix}
      {n.toLocaleString()}
      {suffix}
    </span>
  );
}

/**
 * Phone-only bottom bar that slides in once the hero (marked with
 * id={watchId}) has scrolled away, keeping the main actions in thumb reach.
 */
export function StickyBar({
  watchId,
  actions,
}: {
  watchId: string;
  actions: { href: string; label: string; primary?: boolean }[];
}) {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const el = document.getElementById(watchId);
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setShow(!e.isIntersecting), {
      threshold: 0,
    });
    io.observe(el);
    return () => io.disconnect();
  }, [watchId]);
  return (
    <div
      className={`fixed inset-x-0 bottom-0 z-[60] border-t border-white/10 bg-[#070a16]/85 p-3 backdrop-blur-xl transition-transform duration-500 md:hidden ${show ? "translate-y-0" : "translate-y-full"}`}
    >
      <div className="flex gap-2">
        {actions.map((a) => (
          <Link
            key={a.href}
            href={a.href}
            className={`flex-1 rounded-xl px-3 py-3 text-center text-sm font-bold ${
              a.primary
                ? "bg-secondary text-dark-background"
                : "border border-white/15 bg-white/5 text-white"
            }`}
          >
            {a.label}
          </Link>
        ))}
      </div>
    </div>
  );
}
