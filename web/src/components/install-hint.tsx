"use client";

import { Share, SquarePlus, X } from "lucide-react";
import { useEffect, useState, useSyncExternalStore } from "react";
import { APP_NAME } from "@/lib/data";

type Where = "hide" | "ios" | "other";
const KEY = "install-hint";

interface InstallPromptEvent extends Event {
  prompt: () => Promise<void>;
}

function subscribe(onChange: () => void) {
  const standalone = window.matchMedia("(display-mode: standalone)");
  const narrow = window.matchMedia("(max-width: 819px)");
  standalone.addEventListener("change", onChange);
  narrow.addEventListener("change", onChange);
  return () => {
    standalone.removeEventListener("change", onChange);
    narrow.removeEventListener("change", onChange);
  };
}

function where(): Where {
  const installed =
    window.matchMedia("(display-mode: standalone)").matches || (navigator as Navigator & { standalone?: boolean }).standalone === true;
  if (installed) return "hide";
  if (!window.matchMedia("(max-width: 819px)").matches) return "hide";
  try {
    if (window.localStorage.getItem(KEY) === "off") return "hide";
  } catch {
    // Private browsing can block storage. Show the hint; closing it still works for this visit.
  }
  return /iphone|ipad|ipod/i.test(navigator.userAgent) ? "ios" : "other";
}

/** Shown on a phone while the app is still running in a browser tab. Never shown once installed. */
export function InstallHint() {
  const place = useSyncExternalStore<Where>(subscribe, where, () => "hide");
  const [closed, setClosed] = useState(false);
  const [prompt, setPrompt] = useState<InstallPromptEvent | null>(null);

  useEffect(() => {
    const onPrompt = (e: Event) => {
      e.preventDefault();
      setPrompt(e as InstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    return () => window.removeEventListener("beforeinstallprompt", onPrompt);
  }, []);

  if (place === "hide" || closed) return null;

  const close = () => {
    try {
      window.localStorage.setItem(KEY, "off");
    } catch {
      // See above.
    }
    setClosed(true);
  };

  return (
    <div className="mx-4 mb-4 mt-1 flex items-start gap-3 rounded-[22px] bg-brand p-4 text-white">
      <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/15">
        <SquarePlus size={20} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[16px] font-semibold leading-tight">Add {APP_NAME} to your Home Screen</p>
        {place === "ios" ? (
          <p className="mt-1 text-[14px] leading-snug text-white/85">
            Tap <Share size={14} className="inline align-[-2px]" /> Share, then Add to Home Screen. It opens full screen, like any app.
          </p>
        ) : prompt ? (
          <button
            type="button"
            onClick={() => {
              void prompt.prompt();
              close();
            }}
            className="mt-2 inline-flex h-9 items-center rounded-full bg-white px-4 text-[14px] font-semibold text-brand"
          >
            Install
          </button>
        ) : (
          <p className="mt-1 text-[14px] leading-snug text-white/85">Open the browser menu, then tap Install app or Add to Home screen.</p>
        )}
      </div>
      <button type="button" aria-label="Not now" onClick={close} className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/15">
        <X size={16} />
      </button>
    </div>
  );
}
