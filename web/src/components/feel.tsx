"use client";

import { useEffect, useMemo, useState } from "react";

/* Small things that make the app feel native: haptics, toasts, confetti, counting numbers, screen transitions. */

/** A light tap on phones that support it (Android). iPhone Safari ignores it, which is fine. */
export function haptic(kind: "tap" | "success" | "warn" = "tap") {
  if (typeof navigator === "undefined" || !("vibrate" in navigator)) return;
  try {
    navigator.vibrate(kind === "tap" ? 8 : kind === "success" ? [12, 40, 18] : [30, 30, 30]);
  } catch {
    // some browsers throw when vibration is blocked
  }
}

const TOAST_EVENT = "app:toast";

/** Show a short message at the top of the screen. */
export function toast(message: string) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(TOAST_EVENT, { detail: message }));
}

export function Toaster() {
  const [items, setItems] = useState<{ id: number; text: string }[]>([]);
  useEffect(() => {
    let n = 0;
    const onToast = (e: Event) => {
      const id = ++n;
      setItems((list) => [...list.slice(-1), { id, text: (e as CustomEvent<string>).detail }]);
      window.setTimeout(() => setItems((list) => list.filter((t) => t.id !== id)), 2200);
    };
    window.addEventListener(TOAST_EVENT, onToast);
    return () => window.removeEventListener(TOAST_EVENT, onToast);
  }, []);
  return (
    <div className="pointer-events-none fixed inset-x-0 top-0 z-[70] mx-auto flex max-w-[430px] flex-col items-center gap-2 px-4 pt-[max(env(safe-area-inset-top),14px)]">
      {items.map((t) => (
        <div key={t.id} role="status" className="toast-in rounded-full bg-ink px-4 py-2.5 text-[15px] font-semibold text-white shadow-lg shadow-black/20">
          {t.text}
        </div>
      ))}
    </div>
  );
}

function seeded(start: number) {
  let s = start;
  return () => {
    s = (s * 16807) % 2147483647;
    return s / 2147483647;
  };
}

const CONFETTI_COLORS = ["#1F4F82", "#2B8A57", "#C9A46A", "#8DB3DA", "#E5484D", "#F3C969"];

/** A one-off burst of confetti from the middle of the screen. */
export function Confetti({ pieces = 70 }: { pieces?: number }) {
  const bits = useMemo(() => {
    // Deterministic, so it doesn't jump between renders.
    const rand = seeded(7);
    return Array.from({ length: pieces }, (_, i) => {
      const angle = rand() * Math.PI * 2;
      const dist = 120 + rand() * 220;
      return {
        i,
        x: Math.cos(angle) * dist,
        y: Math.sin(angle) * dist * 0.8 - 120,
        r: rand() * 720 - 360,
        w: 6 + rand() * 6,
        h: 8 + rand() * 10,
        delay: rand() * 0.12,
        color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
        round: rand() > 0.7,
      };
    });
  }, [pieces]);
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-[65] mx-auto max-w-[430px] overflow-hidden">
      {bits.map((b) => (
        <span
          key={b.i}
          className="confetti-bit absolute left-1/2 top-[38%]"
          style={
            {
              width: b.w,
              height: b.round ? b.w : b.h,
              background: b.color,
              borderRadius: b.round ? 999 : 2,
              animationDelay: `${b.delay}s`,
              "--x": `${b.x}px`,
              "--y": `${b.y}px`,
              "--r": `${b.r}deg`,
            } as React.CSSProperties
          }
        />
      ))}
    </div>
  );
}

/** A check mark that draws itself inside a filled circle. */
export function SuccessCheck({ size = 96, color = "var(--money)" }: { size?: number; color?: string }) {
  return (
    <span className="pop inline-flex items-center justify-center rounded-full text-white" style={{ width: size, height: size, background: color }}>
      <svg width={size * 0.5} height={size * 0.5} viewBox="0 0 24 24" fill="none" aria-hidden>
        <path d="M5 12.5l4.5 4.5L19 7.5" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" className="draw-check" />
      </svg>
    </span>
  );
}

/** Counts up to `value` the first time it shows (from 82% of it), then simply follows it. */
export function useCountUp(value: number, ms = 700): number {
  const [k, setK] = useState<number | null>(0.82);
  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const start = performance.now();
    let frame = 0;
    const step = (t: number) => {
      const p = reduce ? 1 : Math.min(1, (t - start) / ms);
      if (p >= 1) return setK(null);
      setK(0.82 + 0.18 * (1 - Math.pow(1 - p, 3)));
      frame = requestAnimationFrame(step);
    };
    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [ms]);
  return k === null ? value : value * k;
}
