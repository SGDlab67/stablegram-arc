"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ChartPie, ChevronLeft, House, QrCode, Search, Users } from "lucide-react";
import type { ReactNode } from "react";
import { APP_NAME } from "@/lib/data";
import { useStore } from "@/lib/store";
import { Avatar } from "./ui";

function Mark({ size = 28 }: { size?: number }) {
  // The app's own mark: two overlapping coins. Not Venmo's "V".
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden>
      <circle cx="12" cy="16" r="8" stroke="white" strokeWidth="3" />
      <circle cx="20" cy="16" r="8" stroke="white" strokeWidth="3" />
    </svg>
  );
}

export function Wordmark({ className = "" }: { className?: string }) {
  return <span className={`font-bold tracking-tight text-brand ${className}`}>{APP_NAME}</span>;
}

export function TabBar() {
  const pathname = usePathname();
  const { incoming, requests, me } = useStore();
  const openRequests = requests.filter((r) => r.payer === me.handle && r.status === "open").length;
  const tab = (href: string, label: string, icon: ReactNode, active: boolean, dot = false) => (
    <Link href={href} className={`relative flex w-16 flex-col items-center gap-1 pt-2 text-[11px] font-medium ${active ? "text-ink" : "text-brand"}`}>
      <span className="relative">
        {icon}
        {dot && <span className="absolute -right-1 -top-0.5 h-2.5 w-2.5 rounded-full bg-[#E5484D] ring-2 ring-white" />}
      </span>
      {label}
    </Link>
  );
  return (
    <nav className="fixed bottom-0 left-1/2 z-40 w-full max-w-[430px] -translate-x-1/2 border-t border-line bg-white pb-[max(env(safe-area-inset-bottom),10px)]">
      <div className="flex items-end justify-between px-3">
        {tab("/", "Home", <House size={24} />, pathname === "/")}
        {tab("/friends", "Friends", <Users size={24} />, pathname.startsWith("/friends"), incoming.length > 0)}
        <Link href="/pay" className="-mt-7 flex w-20 flex-col items-center gap-1 text-[11px] font-medium text-brand">
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-brand shadow-lg shadow-brand/30 ring-4 ring-white">
            <Mark />
          </span>
          Pay/Request
        </Link>
        {tab("/portfolio", "Portfolio", <ChartPie size={24} />, pathname.startsWith("/portfolio"))}
        {tab("/me", "Me", <Avatar handle={me.handle} size={26} />, pathname.startsWith("/me"), openRequests > 0)}
      </div>
    </nav>
  );
}

export function Screen({ children, tabs = true }: { children: ReactNode; tabs?: boolean }) {
  return (
    <div className={`min-h-dvh ${tabs ? "pb-28" : "pb-8"}`}>
      {children}
      {tabs && <TabBar />}
    </div>
  );
}

export function SearchBar({ placeholder = "Find a person" }: { placeholder?: string }) {
  return (
    <div className="sticky top-0 z-30 flex items-center gap-3 bg-page/95 px-4 pb-3 pt-4 backdrop-blur">
      <Link href="/friends?search=1" className="flex h-14 flex-1 items-center gap-3 rounded-full bg-white px-5 text-[17px] text-muted shadow-sm">
        <Search size={20} className="text-ink" />
        {placeholder}
      </Link>
      <Link href="/me/code" aria-label="My code and scanner" className="flex h-14 w-14 items-center justify-center rounded-full bg-white shadow-sm">
        <QrCode size={22} />
      </Link>
    </div>
  );
}

export function BackHeader({ title, right, fallback = "/" }: { title?: string; right?: ReactNode; fallback?: string }) {
  const router = useRouter();
  return (
    <div className="sticky top-0 z-30 flex h-14 items-center justify-between bg-page/95 px-3 backdrop-blur">
      <button
        type="button"
        aria-label="Back"
        onClick={() => (window.history.length > 1 ? router.back() : router.push(fallback))}
        className="flex h-10 w-10 items-center justify-center rounded-full bg-white"
      >
        <ChevronLeft size={22} />
      </button>
      <span className="text-[17px] font-semibold">{title}</span>
      <span className="flex min-w-10 justify-end">{right}</span>
    </div>
  );
}
