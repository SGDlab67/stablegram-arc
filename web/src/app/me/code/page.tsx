"use client";

import { Camera, Copy, Image as ImageIcon, Share } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { useEffect, useState } from "react";
import { BackHeader, Screen } from "@/components/shell";
import { Avatar, GhostButton } from "@/components/ui";
import { useStore } from "@/lib/store";

export default function CodePage() {
  const { me } = useStore();
  const [tab, setTab] = useState<"mine" | "scan">("mine");
  const [origin, setOrigin] = useState("");
  const [copied, setCopied] = useState(false);
  useEffect(() => {
    // The link depends on where the app is served from, which only the browser knows.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setOrigin(window.location.origin);
  }, []);
  const link = `${origin}/u/${me.handle}`;

  return (
    <Screen tabs={false}>
      <BackHeader title="" fallback="/me" />
      <div className="mx-4 flex rounded-full bg-white p-1 text-[15px] font-semibold">
        {(
          [
            ["scan", "Scan"],
            ["mine", "My code"],
          ] as const
        ).map(([id, label]) => (
          <button key={id} type="button" onClick={() => setTab(id)} className={`h-10 flex-1 rounded-full ${tab === id ? "bg-ink text-white" : "text-muted"}`}>
            {label}
          </button>
        ))}
      </div>

      {tab === "mine" ? (
        <div className="flex flex-col items-center px-6 pt-8">
          <div className="relative rounded-[32px] bg-white p-6 shadow-sm">
            {origin ? <QRCodeSVG value={link} size={248} level="H" fgColor="#111111" /> : <div className="h-[248px] w-[248px]" />}
            <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full ring-8 ring-white">
              <Avatar handle={me.handle} size={64} />
            </span>
          </div>
          <p className="mt-5 text-[22px] font-semibold">
            {me.first} {me.last}
          </p>
          <p className="text-[16px] text-muted">@{me.handle}</p>
          <div className="mt-6 flex gap-3">
            <GhostButton className="h-12 gap-2 bg-white px-5">
              <Share size={18} /> Share
            </GhostButton>
            <GhostButton
              className="h-12 gap-2 bg-white px-5"
              onClick={() => {
                void navigator.clipboard?.writeText(link);
                setCopied(true);
              }}
            >
              <Copy size={18} /> {copied ? "Copied" : "Copy link"}
            </GhostButton>
          </div>
          <p className="mt-6 text-center text-[14px] text-muted">Anyone can scan this with their phone camera to pay you.</p>
        </div>
      ) : (
        <div className="flex flex-col items-center px-6 pt-8">
          <div className="flex aspect-square w-full flex-col items-center justify-center rounded-[32px] bg-ink text-white">
            <Camera size={40} />
            <p className="mt-3 text-[16px] font-medium">Point at a code</p>
            <p className="mt-1 px-8 text-center text-[13px] text-white/60">The camera opens here in the real build.</p>
          </div>
          <GhostButton className="mt-5 h-12 gap-2 bg-white px-5">
            <ImageIcon size={18} /> Choose a photo
          </GhostButton>
        </div>
      )}
    </Screen>
  );
}
