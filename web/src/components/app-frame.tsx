"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { QRCodeSVG } from "qrcode.react";
import { Suspense, useEffect, useRef, useSyncExternalStore, type ReactNode, type RefObject } from "react";
import { APP_NAME } from "@/lib/data";

const noSubscribe = () => () => {};

/** Where the app is being served from. Empty on the server and during the first paint. */
function useOrigin(): string {
  return useSyncExternalStore(
    noSubscribe,
    () => window.location.origin,
    () => "",
  );
}

function PhonePanel() {
  const origin = useOrigin();
  const local = /\/\/(localhost|127\.0\.0\.1|\[::1\])(:|$)/.test(origin);
  return (
    <aside className="aside">
      <p className="text-[28px] font-bold tracking-tight text-brand">{APP_NAME}</p>
      <h1 className="mt-3 text-[30px] font-semibold leading-[1.1] tracking-tight">This is a phone app.</h1>
      <p className="mt-3 text-[16px] leading-relaxed text-[#5b544a]">
        Scan the code with your phone&apos;s camera to open it there. The frame on the left is the same app at phone size.
      </p>

      <div className="mt-6 inline-block rounded-[28px] bg-white p-5">
        {origin && !local ? (
          <QRCodeSVG value={origin} size={168} level="M" fgColor="#111111" />
        ) : (
          <div className="flex h-[168px] w-[168px] items-center justify-center text-center text-[13px] leading-snug text-muted">
            {local ? "Running on this computer. Deploy it, or open it at this computer's network address, to get a code a phone can scan." : ""}
          </div>
        )}
      </div>

      <h2 className="mt-7 text-[13px] font-semibold uppercase tracking-wide text-[#7a7265]">Put it on your Home Screen</h2>
      <ul className="mt-2 space-y-1.5 text-[15px] leading-snug text-[#5b544a]">
        <li>
          <span className="font-semibold text-ink">iPhone:</span> open in Safari, tap Share, then Add to Home Screen.
        </li>
        <li>
          <span className="font-semibold text-ink">Android:</span> open in Chrome, tap the menu, then Install app.
        </li>
      </ul>
      <p className="mt-2 text-[15px] leading-snug text-[#5b544a]">It then opens full screen from its own icon, with no browser bar.</p>

      <Link href="/welcome" className="mt-6 inline-flex h-11 items-center rounded-full bg-white px-5 text-[15px] font-semibold text-ink">
        See the sign-up screens
      </Link>
    </aside>
  );
}

/** Inside the frame the app scrolls in its own box, so a new screen has to be sent to the top by hand. */
function ScrollReset({ target }: { target: RefObject<HTMLDivElement | null> }) {
  const pathname = usePathname();
  useEffect(() => {
    target.current?.scrollTo(0, 0);
  }, [pathname, target]);
  return null;
}

export function AppFrame({ children }: { children: ReactNode }) {
  const scroller = useRef<HTMLDivElement>(null);
  return (
    <div className="stage">
      {/* Reading the address has to sit under Suspense so pages can still be prepared ahead of time. */}
      <Suspense fallback={null}>
        <ScrollReset target={scroller} />
      </Suspense>
      <div className="device">
        <div ref={scroller} className="device-scroll">
          {children}
        </div>
      </div>
      <PhonePanel />
    </div>
  );
}
