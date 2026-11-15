"use client";

import Link from "next/link";
import { Globe, Lock } from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { assetOf, initials, personOf, type Audience } from "@/lib/data";
import { useStore } from "@/lib/store";

export function Avatar({ handle, size = 40, ring = false }: { handle: string; size?: number; ring?: boolean }) {
  const { people } = useStore();
  const p = personOf(handle, people);
  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center rounded-full font-semibold text-white ${ring ? "ring-2 ring-white" : ""}`}
      style={{
        width: size,
        height: size,
        fontSize: Math.max(10, size * 0.38),
        ...(p.photo ? { backgroundColor: p.color, backgroundImage: `url(${p.photo})`, backgroundSize: "cover", backgroundPosition: "center" } : { background: p.color }),
      }}
      role="img"
      aria-label={`${p.first} ${p.last}`}
    >
      {p.photo ? null : initials(p)}
    </span>
  );
}

export function AssetDot({ symbol, size = 36 }: { symbol: string; size?: number }) {
  const a = assetOf(symbol);
  if (a.logo) {
    return (
      <span
        className="inline-flex shrink-0 rounded-full bg-white ring-1 ring-black/5"
        style={{ width: size, height: size, backgroundImage: `url(${a.logo})`, backgroundSize: "cover", backgroundPosition: "center" }}
        role="img"
        aria-label={a.name}
      />
    );
  }
  const label = symbol.length > 4 ? symbol.slice(0, 4) : symbol;
  return (
    <span
      className="inline-flex shrink-0 items-center justify-center rounded-full font-bold tracking-tight text-white"
      style={{ width: size, height: size, background: a.color, fontSize: Math.max(8, size * 0.27) }}
      aria-label={a.name}
    >
      {label}
    </span>
  );
}

/** The asset a payment was sent in. The receiver gets the same asset. */
export function AssetChip({ symbol, large = false }: { symbol: string; large?: boolean }) {
  const a = assetOf(symbol);
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full bg-chip font-medium text-ink ${large ? "px-3 py-1.5 text-base" : "h-9 px-2.5 text-[13px]"}`}>
      <AssetDot symbol={symbol} size={large ? 26 : 20} />
      {symbol === "USDC" ? "Dollars" : a.name}
    </span>
  );
}

const AUDIENCE: Record<Audience, { label: string; viewerLabel: string; Icon: typeof Globe }> = {
  public: { label: "Public", viewerLabel: "Public", Icon: Globe },
  private: { label: "Private", viewerLabel: "Private", Icon: Lock },
};

export function AudienceLabel({ audience, verbose = false, className = "" }: { audience: Audience; verbose?: boolean; className?: string }) {
  const { Icon, label, viewerLabel } = AUDIENCE[audience];
  return (
    <span className={`inline-flex items-center gap-1.5 ${className}`}>
      <Icon size={15} strokeWidth={2} />
      {verbose ? viewerLabel : label}
    </span>
  );
}

/** Public or Private, as two side-by-side buttons. */
export function AudienceToggle({ value, onChange }: { value: Audience; onChange: (a: Audience) => void }) {
  return (
    <div className="inline-flex rounded-full bg-chip p-1">
      {(["public", "private"] as const).map((a) => {
        const { Icon, label } = AUDIENCE[a];
        const on = value === a;
        return (
          <button
            key={a}
            type="button"
            aria-pressed={on}
            onClick={() => onChange(a)}
            className={`inline-flex h-8 items-center gap-1.5 rounded-full px-3 text-[14px] font-semibold ${on ? "bg-white text-ink shadow-sm" : "text-muted"}`}
          >
            <Icon size={14} strokeWidth={2.2} />
            {label}
          </button>
        );
      })}
    </div>
  );
}

export function audienceIcon(a: Audience) {
  return AUDIENCE[a].Icon;
}

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`rounded-[28px] bg-white p-5 ${className}`}>{children}</div>;
}

export function PrimaryButton({
  children,
  onClick,
  disabled,
  className = "",
  href,
}: {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
  href?: string;
}) {
  const cls = `flex h-14 w-full items-center justify-center rounded-full bg-brand text-lg font-semibold text-white transition active:scale-[0.98] disabled:opacity-40 ${className}`;
  if (href) {
    return (
      <Link href={href} className={cls}>
        {children}
      </Link>
    );
  }
  return (
    <button type="button" onClick={onClick} disabled={disabled} className={cls}>
      {children}
    </button>
  );
}

export function BlackPill({ children, onClick, href }: { children: ReactNode; onClick?: () => void; href?: string }) {
  const cls = "inline-flex h-12 items-center rounded-full bg-ink px-6 text-[17px] font-semibold text-white active:scale-[0.97]";
  if (href) {
    return (
      <Link href={href} className={cls}>
        {children}
      </Link>
    );
  }
  return (
    <button type="button" onClick={onClick} className={cls}>
      {children}
    </button>
  );
}

export function GhostButton({ children, onClick, className = "" }: { children: ReactNode; onClick?: () => void; className?: string }) {
  return (
    <button type="button" onClick={onClick} className={`inline-flex h-10 items-center justify-center rounded-full bg-chip px-4 text-[15px] font-semibold text-ink active:scale-[0.97] ${className}`}>
      {children}
    </button>
  );
}

export function Sheet({ open, onClose, children, title }: { open: boolean; onClose: () => void; children: ReactNode; title?: string }) {
  const [dragY, setDragY] = useState(0);
  const [dragging, setDragging] = useState(false);
  const start = useRef<number | null>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;
  // Drag the handle (or the title) down to dismiss, like an iPhone sheet.
  const grab = {
    onPointerDown: (e: React.PointerEvent) => {
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
      start.current = e.clientY;
      setDragging(true);
    },
    onPointerMove: (e: React.PointerEvent) => {
      if (start.current !== null) setDragY(Math.max(0, e.clientY - start.current));
    },
    onPointerUp: () => {
      if (dragY > 90) onClose();
      start.current = null;
      setDragging(false);
      setDragY(0);
    },
    onPointerCancel: () => {
      start.current = null;
      setDragging(false);
      setDragY(0);
    },
  };
  return (
    <div className="fixed inset-0 z-50 mx-auto flex max-w-[430px] items-end" role="dialog" aria-modal="true" aria-label={title}>
      <button type="button" aria-label="Close" className="no-press fade-in absolute inset-0 bg-black/40" style={{ opacity: 1 - Math.min(dragY / 400, 0.6) }} onClick={onClose} />
      <div
        className="slide-up relative max-h-sheet w-full overflow-y-auto rounded-t-[28px] bg-white p-5 pb-[max(env(safe-area-inset-bottom),32px)]"
        style={{ transform: dragY ? `translateY(${dragY}px)` : undefined, transition: dragging ? "none" : "transform 0.2s ease" }}
      >
        <div {...grab} className="-mx-5 -mt-5 mb-1 flex cursor-grab touch-none justify-center pb-3 pt-3">
          <div className="h-1.5 w-10 rounded-full bg-line" />
        </div>
        {title && (
          <h2 {...grab} className="mb-4 touch-none text-xl font-semibold">
            {title}
          </h2>
        )}
        {children}
      </div>
    </div>
  );
}

export function SectionTitle({ children, right }: { children: ReactNode; right?: ReactNode }) {
  return (
    <div className="mb-2 mt-6 flex items-center justify-between px-1">
      <h2 className="text-[13px] font-semibold uppercase tracking-wide text-muted">{children}</h2>
      {right}
    </div>
  );
}

export function PreviewNote() {
  return (
    <p className="px-6 pb-4 pt-8 text-center text-xs leading-relaxed text-muted">
      Design preview. Sample people and payments. Demo assets are test tokens that follow real prices (snapshot Nov 13 2026). Not shares
      or coins, and nothing here is advice.
    </p>
  );
}

export function Change({ pct, className = "" }: { pct: number; className?: string }) {
  if (pct === 0) return <span className={`text-muted ${className}`}>0.00%</span>;
  const up = pct > 0;
  return (
    <span className={`${up ? "text-money" : "text-down"} ${className}`}>
      {up ? "▲" : "▼"} {Math.abs(pct).toFixed(2)}%
    </span>
  );
}
