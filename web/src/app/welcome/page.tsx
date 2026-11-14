"use client";

import { useRouter } from "next/navigation";
import { ArrowRight, Camera, Check, ChevronLeft, Sparkles, Wallet } from "lucide-react";
import { useRef, useState } from "react";
import { Wordmark } from "@/components/shell";
import { AssetChip, AssetDot, AudienceLabel, PrimaryButton, Sheet } from "@/components/ui";
import {
  AVATAR_COLORS,
  HANDLE_RULE,
  RESERVED_HANDLES,
  STARTER_ASSET_USD,
  STARTER_CHOICES,
  STARTER_DOLLARS,
  assetOf,
  usd,
  type Audience,
} from "@/lib/data";
import { useStore } from "@/lib/store";

const STEPS = ["intro", "signin", "name", "username", "photo", "first", "audience", "done"] as const;
type Step = (typeof STEPS)[number];

const WALLETS = ["MetaMask", "Phantom", "Rabby", "Coinbase Wallet"];
const AUDIENCES: { id: Audience; hint: string }[] = [
  { id: "public", hint: "Anyone can see the names and the note." },
  { id: "friends", hint: "Your friends, and the other person's friends." },
  { id: "private", hint: "Only you and the other person." },
];

/** Crops to a square and shrinks, so a phone photo becomes a small profile picture. */
async function toAvatar(file: File): Promise<string> {
  const bitmap = await createImageBitmap(file);
  const side = Math.min(bitmap.width, bitmap.height);
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("This browser cannot resize the photo.");
  ctx.drawImage(bitmap, (bitmap.width - side) / 2, (bitmap.height - side) / 2, side, side, 0, 0, 256, 256);
  return canvas.toDataURL("image/jpeg", 0.85);
}

export default function Welcome() {
  const router = useRouter();
  const { people, signUp, resetToSample } = useStore();
  const [step, setStep] = useState<Step>("intro");
  const [walletsOpen, setWalletsOpen] = useState(false);
  const [wallet, setWallet] = useState<string | null>(null);
  const [first, setFirst] = useState("");
  const [last, setLast] = useState("");
  const [handle, setHandle] = useState("");
  const [color, setColor] = useState(AVATAR_COLORS[0]);
  const [photo, setPhoto] = useState<string | undefined>(undefined);
  const [photoError, setPhotoError] = useState("");
  const [firstAsset, setFirstAsset] = useState(STARTER_CHOICES[0]);
  const [audience, setAudience] = useState<Audience>("public");
  const fileInput = useRef<HTMLInputElement>(null);

  const index = STEPS.indexOf(step);
  const go = (to: Step) => setStep(to);
  const next = () => setStep(STEPS[Math.min(index + 1, STEPS.length - 1)]);
  const back = () => setStep(STEPS[Math.max(index - 1, 0)]);

  // On the "done" step the new account is already in the list, so its own name must not count as taken.
  const taken = step !== "done" && (people.some((p) => p.handle === handle) || RESERVED_HANDLES.includes(handle));
  const validHandle = HANDLE_RULE.test(handle);
  const handleMessage = !handle
    ? "3 to 20 lower-case letters, numbers or underscores."
    : !validHandle
      ? "Use 3 to 20 lower-case letters, numbers or underscores."
      : taken
        ? `@${handle} is taken.`
        : `@${handle} is available.`;
  const clean = (v: string) => v.toLowerCase().replace(/[^a-z0-9_]/g, "");
  const ideas = [clean(first + last), clean(`${first}_${last}`), clean(first + (last[0] ?? "")), clean(`${first}${last}1`)]
    .filter((v, i, all) => HANDLE_RULE.test(v) && all.indexOf(v) === i)
    .filter((v) => !people.some((p) => p.handle === v) && !RESERVED_HANDLES.includes(v) && v !== handle)
    .slice(0, 3);

  const asset = assetOf(firstAsset);
  const startsWith =
    firstAsset === "USDC"
      ? `${usd(STARTER_DOLLARS + STARTER_ASSET_USD)} in dollars`
      : `${usd(STARTER_DOLLARS)} in dollars and ${usd(STARTER_ASSET_USD)} of ${asset.name}`;

  const create = () => {
    signUp({ handle, first: first.trim(), last: last.trim(), color, photo, firstAsset, audience });
    go("done");
  };

  const preview = (size: number) => (
    <span
      className="inline-flex shrink-0 items-center justify-center rounded-full font-semibold text-white"
      style={{
        width: size,
        height: size,
        fontSize: size * 0.38,
        ...(photo ? { backgroundImage: `url(${photo})`, backgroundSize: "cover", backgroundPosition: "center" } : { background: color }),
      }}
    >
      {photo ? null : `${first[0] ?? ""}${last[0] ?? ""}`.toUpperCase()}
    </span>
  );

  const title = (text: string, sub?: string) => (
    <>
      <h1 className="text-[32px] font-semibold leading-[1.08] tracking-tight">{text}</h1>
      {sub && <p className="mt-3 text-[16px] leading-relaxed text-[#5b544a]">{sub}</p>}
    </>
  );

  const field = "h-14 w-full rounded-2xl border border-[#ddd5c8] bg-white px-4 text-[18px] outline-none focus:border-brand";
  const showHeader = step !== "intro" && step !== "done";

  return (
    <div className="min-h-app flex flex-col bg-page">
      <div className="flex h-14 items-center gap-3 px-3 pt-1">
        {showHeader && (
          <>
            <button type="button" aria-label="Back" onClick={back} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white">
              <ChevronLeft size={22} />
            </button>
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-line">
              <div className="h-full rounded-full bg-brand transition-all" style={{ width: `${(index / (STEPS.length - 2)) * 100}%` }} />
            </div>
            <span className="w-10" />
          </>
        )}
      </div>

      <div className="flex flex-1 flex-col px-6 pb-[max(env(safe-area-inset-bottom),24px)] pt-2">
        {step === "intro" && (
          <>
            <Wordmark className="text-[30px]" mark />
            <div className="flex flex-1 flex-col justify-center py-6">
              <div className="rounded-[28px] bg-white p-5">
                <p className="text-[15px] font-medium text-muted">You send @wes</p>
                <div className="mt-1 flex items-center gap-2">
                  <span className="text-[30px] font-semibold tracking-tight">$10</span>
                  <AssetChip symbol="NVDA" large />
                </div>
                <div className="my-3 flex items-center gap-2 text-muted">
                  <span className="h-px flex-1 bg-line" />
                  <ArrowRight size={18} />
                  <span className="h-px flex-1 bg-line" />
                </div>
                <p className="text-[15px] font-medium text-muted">Wes gets $10 of NVIDIA</p>
                <p className="mt-1 text-[15px] leading-snug text-muted">In his own wallet. He keeps it, or sells it for dollars whenever he wants.</p>
              </div>
            </div>
            {title("Settle up in stocks.", "Pay friends back with a slice of your portfolio: $10 of NVIDIA, or bitcoin, by username. They get exactly what you sent.")}
            <PrimaryButton className="mt-7" onClick={next}>
              Get started
            </PrimaryButton>
            <button
              type="button"
              onClick={() => {
                resetToSample();
                router.replace("/");
              }}
              className="mt-2 h-12 text-[16px] font-semibold text-brand"
            >
              I already have an account
            </button>
          </>
        )}

        {step === "signin" && (
          <>
            {title("How do you want to sign in?", "Either way, the wallet is yours. We never hold your money.")}
            <div className="mt-6 space-y-3">
              <button
                type="button"
                onClick={() => {
                  setWallet(null);
                  next();
                }}
                className="flex w-full items-center gap-4 rounded-[22px] bg-white p-4 text-left"
              >
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-brand-soft text-brand">
                  <Sparkles size={22} />
                </span>
                <span>
                  <span className="block text-[17px] font-semibold">Start without a wallet</span>
                  <span className="block text-[14px] leading-snug text-muted">We make one on this phone. You can back it up later.</span>
                </span>
              </button>
              <button type="button" onClick={() => setWalletsOpen(true)} className="flex w-full items-center gap-4 rounded-[22px] bg-white p-4 text-left">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-chip">
                  <Wallet size={22} />
                </span>
                <span>
                  <span className="block text-[17px] font-semibold">Use my wallet</span>
                  <span className="block text-[14px] leading-snug text-muted">MetaMask, Phantom, Rabby or Coinbase Wallet.</span>
                </span>
              </button>
            </div>
            <Sheet open={walletsOpen} onClose={() => setWalletsOpen(false)} title="Choose your wallet">
              <div className="space-y-2">
                {WALLETS.map((w) => (
                  <button
                    key={w}
                    type="button"
                    onClick={() => {
                      setWallet(w);
                      setWalletsOpen(false);
                      next();
                    }}
                    className="flex h-14 w-full items-center justify-between rounded-2xl bg-chip px-4 text-[17px] font-semibold"
                  >
                    {w}
                    <ArrowRight size={18} className="text-muted" />
                  </button>
                ))}
              </div>
              <p className="mt-4 text-[13px] leading-relaxed text-muted">
                Phantom needs Testnet Mode switched on first. In this preview no wallet is opened; the real build asks you to sign one message.
              </p>
            </Sheet>
          </>
        )}

        {step === "name" && (
          <>
            {title("What's your name?", "Friends see this next to your payments.")}
            <div className="mt-6 space-y-3">
              <input autoFocus value={first} onChange={(e) => setFirst(e.target.value)} placeholder="First name" autoComplete="given-name" maxLength={30} className={field} />
              <input value={last} onChange={(e) => setLast(e.target.value)} placeholder="Last name" autoComplete="family-name" maxLength={30} className={field} />
            </div>
            <div className="flex-1" />
            <PrimaryButton onClick={next} disabled={!first.trim() || !last.trim()}>
              Continue
            </PrimaryButton>
          </>
        )}

        {step === "username" && (
          <>
            {title("Pick a username", "This is how people find and pay you. No wallet address needed.")}
            <label className={`mt-6 flex items-center gap-1 ${field}`}>
              <span className="text-muted">@</span>
              <input
                autoFocus
                value={handle}
                onChange={(e) => setHandle(clean(e.target.value).slice(0, 20))}
                placeholder="yourname"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                className="w-full bg-transparent outline-none"
              />
              {validHandle && !taken && <Check size={20} className="shrink-0 text-money" />}
            </label>
            <p className={`mt-2 px-1 text-[14px] ${validHandle && !taken ? "text-money" : handle && (taken || !validHandle) ? "text-down" : "text-muted"}`}>{handleMessage}</p>
            {ideas.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {ideas.map((idea) => (
                  <button key={idea} type="button" onClick={() => setHandle(idea)} className="h-10 rounded-full bg-white px-4 text-[15px] font-semibold">
                    @{idea}
                  </button>
                ))}
              </div>
            )}
            {wallet && <p className="mt-4 px-1 text-[13px] text-muted">Payments to this username go to your {wallet} wallet.</p>}
            <div className="flex-1" />
            <PrimaryButton onClick={next} disabled={!validHandle || taken}>
              Continue
            </PrimaryButton>
          </>
        )}

        {step === "photo" && (
          <>
            {title("Add a photo", "It helps friends check they are paying the right person.")}
            <div className="mt-8 flex flex-col items-center">
              <button type="button" onClick={() => fileInput.current?.click()} className="relative" aria-label="Choose a photo">
                {preview(132)}
                <span className="absolute -bottom-1 -right-1 flex h-11 w-11 items-center justify-center rounded-full bg-ink text-white ring-4 ring-page">
                  <Camera size={20} />
                </span>
              </button>
              <input
                ref={fileInput}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  setPhotoError("");
                  toAvatar(file).then(setPhoto, () => setPhotoError("That file could not be read as a photo. Try another."));
                }}
              />
              <p className="mt-4 text-[20px] font-semibold">
                {first} {last}
              </p>
              <p className="text-[15px] text-muted">@{handle}</p>
              {photoError && <p className="mt-3 text-center text-[14px] text-down">{photoError}</p>}
              {photo ? (
                <button type="button" onClick={() => setPhoto(undefined)} className="mt-5 h-10 rounded-full bg-white px-4 text-[15px] font-semibold">
                  Remove photo
                </button>
              ) : (
                <>
                  <p className="mt-6 text-[13px] font-semibold uppercase tracking-wide text-muted">Or pick a colour</p>
                  <div className="mt-3 flex flex-wrap justify-center gap-3">
                    {AVATAR_COLORS.map((c) => (
                      <button
                        key={c}
                        type="button"
                        aria-label={`Colour ${c}`}
                        onClick={() => setColor(c)}
                        className={`h-10 w-10 rounded-full ${color === c ? "ring-2 ring-ink ring-offset-2 ring-offset-page" : ""}`}
                        style={{ background: c }}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>
            <div className="flex-1" />
            <PrimaryButton onClick={next}>{photo ? "Continue" : "Continue without a photo"}</PrimaryButton>
          </>
        )}

        {step === "first" && (
          <>
            {title("Pick your first stock", "Your portfolio is what you pay friends with, so it starts with a little of something.")}
            <div className="mt-5 grid grid-cols-2 gap-3">
              {STARTER_CHOICES.map((symbol) => {
                const a = assetOf(symbol);
                const on = firstAsset === symbol;
                return (
                  <button
                    key={symbol}
                    type="button"
                    onClick={() => setFirstAsset(symbol)}
                    className={`flex items-center gap-3 rounded-[22px] bg-white p-4 text-left ${symbol === "USDC" ? "col-span-2" : ""} ${on ? "ring-2 ring-brand" : ""}`}
                  >
                    <AssetDot symbol={symbol} size={42} />
                    <span className="min-w-0 flex-1">
                      <span className="block text-[16px] font-semibold leading-tight">{symbol === "USDC" ? "Just dollars" : a.name}</span>
                      <span className="block font-mono text-[13px] text-muted">{symbol === "USDC" ? "Pick a stock later" : usd(a.price, { cents: true })}</span>
                    </span>
                    {on && symbol === "USDC" && <Check size={20} className="shrink-0 text-brand" />}
                  </button>
                );
              })}
            </div>
            <p className="mt-4 px-1 text-[14px] leading-relaxed text-muted">
              You start with {startsWith}. This is a demo: the stocks are test tokens that follow real prices.
            </p>
            <div className="flex-1" />
            <PrimaryButton className="mt-4" onClick={next}>
              Continue
            </PrimaryButton>
          </>
        )}

        {step === "audience" && (
          <>
            {title("Who can see your payments?", "You can change this on any payment. Amounts are never shown to other people.")}
            <div className="mt-5 space-y-2">
              {AUDIENCES.map((a) => (
                <button
                  key={a.id}
                  type="button"
                  onClick={() => setAudience(a.id)}
                  className={`flex w-full items-start gap-3 rounded-[22px] p-4 text-left ${audience === a.id ? "bg-brand-soft ring-2 ring-brand" : "bg-white"}`}
                >
                  <span className="flex-1">
                    <AudienceLabel audience={a.id} className="text-[17px] font-semibold" />
                    <span className="mt-0.5 block text-[14px] text-muted">{a.hint}</span>
                  </span>
                  {audience === a.id && <Check size={20} className="text-brand" />}
                </button>
              ))}
            </div>
            <p className="mt-4 px-1 text-[13px] leading-relaxed text-muted">
              Your username is linked to a public wallet. Anyone can see its balances and payments on the blockchain. This setting controls what
              shows in feeds.
            </p>
            <div className="flex-1" />
            <PrimaryButton className="mt-4" onClick={create}>
              Create my account
            </PrimaryButton>
          </>
        )}

        {step === "done" && (
          <div className="flex flex-1 flex-col items-center justify-center text-center">
            <span className="pop relative">
              {preview(112)}
              <span className="absolute -bottom-1 -right-1 flex h-10 w-10 items-center justify-center rounded-full bg-money text-white ring-4 ring-page">
                <Check size={22} strokeWidth={3} />
              </span>
            </span>
            <h1 className="mt-6 text-[32px] font-semibold leading-[1.08] tracking-tight">You&apos;re in, @{handle}.</h1>
            <p className="mt-3 text-[16px] leading-relaxed text-[#5b544a]">
              We added {startsWith} to get you started (demo). Send any of it to a friend by username.
            </p>
            <PrimaryButton className="mt-8" onClick={() => router.replace("/")}>
              Go to Home
            </PrimaryButton>
            <button type="button" onClick={() => router.replace("/friends")} className="mt-2 h-12 text-[16px] font-semibold text-brand">
              Find friends first
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
