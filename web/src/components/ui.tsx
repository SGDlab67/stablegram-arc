"use client";

import Link from "next/link";
import { Globe, Lock, UsersRound } from "lucide-react";
import type { ReactNode } from "react";
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
        ...(p.photo ? { backgroundImage: `url(${p.photo})`, backgroundSize: "cover", backgroundPosition: "center" } : { background: p.color }),
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

export function AssetChip({ pay, receive, large = false }: { pay: string; receive: string; large?: boolean }) {
  const same = pay === receive;
  const dot = large ? 26 : 20;
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full bg-chip font-medium text-ink ${large ? "px-3 py-1.5 text-base" : "px-2.5 py-1 text-sm"}`}>
      <AssetDot symbol={pay} size={dot} />
      {pay}
      {!same && (
        <>
          <span className="text-muted">→</span>
          <AssetDot symbol={receive} size={dot} />
          {receive}
        </>
      )}
    </span>
  );
}

const AUDIENCE: Record<Audience, { label: string; viewerLabel: string; Icon: typeof Globe }> = {
  public: { label: "Public", viewerLabel: "Public", Icon: Globe },
  friends: { label: "Friends", viewerLabel: "Visible to friends", Icon: UsersRound },
  private: { label: "Private", viewerLabel: "Only visible to you", Icon: Lock },
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
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 mx-auto flex max-w-[430px] items-end">
      <button type="button" aria-label="Close" className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="slide-up relative max-h-sheet w-full overflow-y-auto rounded-t-[28px] bg-white p-5 pb-8">
        <div className="mx-auto mb-4 h-1.5 w-10 rounded-full bg-line" />
        {title && <h2 className="mb-4 text-xl font-semibold">{title}</h2>}
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
