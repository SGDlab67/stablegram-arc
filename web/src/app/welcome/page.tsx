"use client";

import { useRouter } from "next/navigation";
import { Camera, Check, UserRound, ChevronLeft, ChevronRight, Globe2, Search, Sparkles, Wallet } from "lucide-react";
import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { Mark } from "@/components/shell";
import { Flag, PrimaryButton, Sheet } from "@/components/ui";
import { APP_NAME, AVATAR_COLORS, HANDLE_RULE, RESERVED_HANDLES, STARTER_ASSET, STARTER_ASSET_USD, STARTER_DOLLARS, assetOf, usd } from "@/lib/data";
import { COUNTRY_CODES, POPULAR_COUNTRIES, countryName, flagOf, guessCountry } from "@/lib/countries";
import { WALLET_INFO, connectWallet, shortAddress, type ConnectedWallet, type WalletKind } from "@/lib/wallet";
import { PhotoPicker } from "@/components/photo-picker";
import { Confetti, haptic } from "@/components/feel";
import { useStore } from "@/lib/store";

/*
 * Sign-up, no ID checks:
 *   1. intro   – navy splash with the logo: "Create a wallet" or "Connect a wallet" (Phantom / MetaMask / other)
 *   2. profile – photo, name or nickname, @username, country flag (all on one screen)
 *   then done.
 */
const STEPS = ["intro", "profile", "done"] as const;
type Step = (typeof STEPS)[number];

const noSubscribe = () => () => {};

function WalletBadge({ kind, size = 44 }: { kind: WalletKind; size?: number }) {
  const style = { width: size, height: size };
  if (kind === "phantom")
    return (
      <span className="flex shrink-0 items-center justify-center rounded-2xl bg-[#AB9FF2] text-white" style={style}>
        <svg viewBox="0 0 24 24" width={size * 0.55} height={size * 0.55} fill="currentColor" aria-hidden>
          <path d="M12 3C6.9 3 3 7.2 3 12.4V19a2 2 0 0 0 3.4 1.4l1.1-1.1 1.1 1.1a2 2 0 0 0 2.8 0l.6-.6.6.6a2 2 0 0 0 2.8 0l1.1-1.1 1.1 1.1A2 2 0 0 0 21 19v-6.6C21 7.2 17.1 3 12 3Zm-3 9.5a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3Zm6 0a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3Z" />
        </svg>
      </span>
    );
  if (kind === "metamask")
    return (
      <span className="flex shrink-0 items-center justify-center rounded-2xl bg-[#FFF1E6] text-[#F6851B]" style={style}>
        <svg viewBox="0 0 24 24" width={size * 0.6} height={size * 0.6} fill="currentColor" aria-hidden>
          <path d="M21 3l-7.3 5.4 1.4-3.2L21 3ZM3 3l7.2 5.5-1.3-3.3L3 3Zm15.4 12.6-1.9 3 4.2 1.2 1.2-4.1-3.5-.1Zm-15.7.1 1.2 4.1 4.1-1.2-1.9-3-3.4.1Zm5.6-5-1.2 1.8 4.1.2-.1-4.5-2.8 2.5Zm7.4 0-2.9-2.6-.1 4.6 4.1-.2-1.1-1.8ZM8.7 18.6l2.5-1.2-2.1-1.7-.4 2.9Zm4.1-1.2 2.5 1.2-.4-2.9-2.1 1.7Z" />
        </svg>
      </span>
    );
  if (kind === "created")
    return (
      <span className="flex shrink-0 items-center justify-center rounded-2xl bg-brand text-white" style={style}>
        <Sparkles size={size * 0.48} />
      </span>
    );
  return (
    <span className="flex shrink-0 items-center justify-center rounded-2xl bg-chip text-ink" style={style}>
      <Wallet size={size * 0.48} />
    </span>
  );
}

export default function Welcome() {
  const router = useRouter();
  const { people, signUp, resetToSample } = useStore();
  const [step, setStep] = useState<Step>("intro");
  const [wallet, setWallet] = useState<ConnectedWallet | null>(null);
  const [connecting, setConnecting] = useState<WalletKind | null>(null);
  const [walletError, setWalletError] = useState("");
  const [name, setName] = useState("");
  const [handle, setHandle] = useState("");
  const [handleEdited, setHandleEdited] = useState(false);
  const [photo, setPhoto] = useState<string | undefined>(undefined);
  const suggestedCountry = useSyncExternalStore(noSubscribe, guessCountry, () => "");
  const [pickedCountry, setPickedCountry] = useState<string | null>(null);
  const country = pickedCountry ?? suggestedCountry;
  const [countryOpen, setCountryOpen] = useState(false);
  const [countryQuery, setCountryQuery] = useState("");
  const [connectOpen, setConnectOpen] = useState(false);

  const index = STEPS.indexOf(step);

  // Match the phone's status bar to the navy splash, then back to beige.
  useEffect(() => {
    const meta = document.querySelector('meta[name="theme-color"]');
    if (!meta) return;
    const before = meta.getAttribute("content");
    meta.setAttribute("content", step === "intro" ? "#0F2C4D" : "#f3eee5");
    return () => {
      if (before) meta.setAttribute("content", before);
    };
  }, [step]);
  const go = (to: Step) => setStep(to);
  const back = () => setStep(STEPS[Math.max(index - 1, 0)]);

  const clean = (v: string) => v.toLowerCase().replace(/[^a-z0-9_]/g, "");
  const [first, ...rest] = name.trim().split(/\s+/);
  const last = rest.join(" ");
  // Initials colour follows the name, so it stays the same on every screen.
  const color = AVATAR_COLORS[[...name].reduce((n, ch) => n + ch.charCodeAt(0), 0) % AVATAR_COLORS.length];
  // Suggest a username from the name until the person types their own.
  const autoHandle = clean(name.trim().replace(/\s+/g, "_")).slice(0, 20);
  const shownHandle = handleEdited ? handle : autoHandle;

  const taken = step !== "done" && (people.some((p) => p.handle === shownHandle) || RESERVED_HANDLES.includes(shownHandle));
  const validHandle = HANDLE_RULE.test(shownHandle);
  const handleMessage = !shownHandle
    ? "3 to 20 lower-case letters, numbers or underscores."
    : !validHandle
      ? "Use 3 to 20 lower-case letters, numbers or underscores."
      : taken
        ? `@${shownHandle} is taken. Try another.`
        : `@${shownHandle} is yours.`;
  const ideas = useMemo(
    () =>
      [`${autoHandle}1`, `${clean(first ?? "")}${clean(last).slice(0, 1)}`, `${autoHandle}_pay`]
        .filter((v, i, all) => HANDLE_RULE.test(v) && all.indexOf(v) === i && v !== shownHandle)
        .filter((v) => !people.some((p) => p.handle === v) && !RESERVED_HANDLES.includes(v))
        .slice(0, 3),
    [autoHandle, first, last, shownHandle, people],
  );
  const ready = !!first && validHandle && !taken;

  const connect = async (kind: WalletKind) => {
    haptic();
    setWalletError("");
    setConnecting(kind);
    try {
      const w = await connectWallet(kind);
      if (w) {
        setWallet(w);
        setConnectOpen(false);
        haptic("success");
        go("profile");
      }
    } catch {
      setWalletError(`${WALLET_INFO[kind].name} didn't connect. Open it and try again.`);
    } finally {
      setConnecting(null);
    }
  };

  const create = () => {
    if (!wallet || !ready) return;
    signUp({ handle: shownHandle, first: first ?? "", last, color, photo, country, address: wallet.address });
    haptic("success");
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
      {photo ? null : `${first?.[0] ?? ""}${last[0] ?? first?.[1] ?? ""}`.toUpperCase() || <UserRound size={size * 0.42} />}
    </span>
  );

  const title = (text: string, sub?: string) => (
    <>
      <h1 className="text-[30px] font-semibold leading-[1.08] tracking-tight">{text}</h1>
      {sub && <p className="mt-2.5 text-[16px] leading-relaxed text-[#5b544a]">{sub}</p>}
    </>
  );

  const field = "h-14 w-full rounded-2xl border border-[#ddd5c8] bg-white px-4 text-[17px] outline-none focus:border-brand";
  const showHeader = step !== "intro" && step !== "done";

  const q = countryQuery.trim().toLowerCase();
  const countryList = COUNTRY_CODES.map((c) => ({ c, n: countryName(c) }))
    .filter((x) => !q || x.n.toLowerCase().includes(q) || x.c.toLowerCase() === q)
    .sort((a, b) => a.n.localeCompare(b.n));

  // The first screen: navy, the logo in the middle, and the two ways in. Everything after it is beige.
  if (step === "intro") {
    return (
      <div className="relative flex min-h-app flex-col overflow-hidden bg-[#0F2C4D] text-[#F3EEE5]">
        <div aria-hidden className="pointer-events-none absolute left-1/2 top-[34%] h-[520px] w-[520px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(91,140,201,0.35)_0%,rgba(15,44,77,0)_65%)]" />
        <div className="relative flex flex-1 flex-col items-center justify-center px-8 text-center">
          <span className="pop drop-shadow-[0_12px_30px_rgba(0,0,0,0.25)]">
            <Mark size={168} className="text-[#F3EEE5]" />
          </span>
          <p className="screen-in mt-7 text-[42px] font-bold tracking-tight">{APP_NAME}</p>
          <p className="screen-in mt-2 text-[17px] text-[#F3EEE5]/70">Pay friends in stocks and crypto.</p>
        </div>

        <div className="relative px-6 pb-[max(env(safe-area-inset-bottom),28px)]">
          <button
            type="button"
            disabled={!!connecting}
            onClick={() => connect("created")}
            className="flex h-14 w-full items-center justify-center gap-2 rounded-full bg-[#F3EEE5] text-[17px] font-semibold text-[#0F2C4D] disabled:opacity-70"
          >
            {connecting === "created" ? <Spinner dark /> : "Create a wallet"}
          </button>
          <button
            type="button"
            disabled={!!connecting}
            onClick={() => setConnectOpen(true)}
            className="mt-3 flex h-14 w-full items-center justify-center gap-2 rounded-full text-[17px] font-semibold text-[#F3EEE5] ring-1 ring-[#F3EEE5]/35 disabled:opacity-70"
          >
            <Wallet size={19} /> Connect a wallet
          </button>
          <button
            type="button"
            onClick={() => {
              resetToSample();
              router.replace("/");
            }}
            className="mt-3 h-11 w-full text-[15px] font-semibold text-[#F3EEE5]/75"
          >
            I already have an account
          </button>
          <p className="mt-1 text-center text-[12px] text-[#F3EEE5]/45">No ID needed. Your money stays in your own wallet.</p>
          {walletError && <p className="mt-2 text-center text-[13px] font-medium text-[#FFB4AE]">{walletError}</p>}
        </div>

        <Sheet open={connectOpen} onClose={() => setConnectOpen(false)} title="Connect a wallet">
          <div className="divide-y divide-line">
            {(["phantom", "metamask", "other"] as const).map((k) => (
              <button key={k} type="button" disabled={!!connecting} onClick={() => connect(k)} className="flex w-full items-center gap-4 py-3.5 text-left disabled:opacity-60">
                <WalletBadge kind={k} size={44} />
                <span className="flex-1">
                  <span className="block text-[17px] font-semibold">{WALLET_INFO[k].name}</span>
                  <span className="block text-[13px] leading-snug text-muted">{WALLET_INFO[k].hint}</span>
                </span>
                {connecting === k ? <Spinner /> : <ChevronRight size={20} className="text-muted" />}
              </button>
            ))}
          </div>
          {walletError && <p className="mt-2 text-[14px] font-medium text-down">{walletError}</p>}
          <p className="mt-3 text-[13px] leading-relaxed text-muted">
            No wallet yet?{" "}
            <a href={WALLET_INFO.phantom.download} target="_blank" rel="noreferrer" className="font-semibold text-brand">
              Get Phantom
            </a>{" "}
            or{" "}
            <a href={WALLET_INFO.metamask.download} target="_blank" rel="noreferrer" className="font-semibold text-brand">
              MetaMask
            </a>
            , or close this and tap Create a wallet.
          </p>
        </Sheet>
      </div>
    );
  }

  return (
    <div className="min-h-app flex flex-col bg-page">
      <div className="flex h-14 items-center gap-3 px-3 pt-1">
        {showHeader && (
          <>
            <button type="button" aria-label="Back" onClick={back} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white">
              <ChevronLeft size={22} />
            </button>
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-line">
              <div className="h-full rounded-full bg-brand transition-all duration-300 ease-out" style={{ width: index >= 1 ? "66%" : "0%" }} />
            </div>
            <span className="w-10" />
          </>
        )}
      </div>

      <div key={step} className="screen-in flex flex-1 flex-col px-6 pb-[max(env(safe-area-inset-bottom),24px)] pt-2">
        {step === "profile" && (
          <>
            {title("Make it yours", "Friends use these to find you and check it's really you.")}
            <div className="mt-5 flex items-center gap-4">
              <PhotoPicker hasPhoto={!!photo} onChange={setPhoto}>
                {(open) => (
                  <button type="button" onClick={open} className="relative" aria-label="Add a photo">
                    {preview(84)}
                    <span className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full bg-ink text-white ring-[3px] ring-page">
                      <Camera size={15} />
                    </span>
                  </button>
                )}
              </PhotoPicker>
              <div className="min-w-0">
                <p className="flex items-center gap-1.5 truncate text-[19px] font-semibold">
                  {name.trim() || "Your name"} <Flag code={country} size={18} />
                </p>
                <p className="truncate text-[15px] text-muted">@{shownHandle || "username"}</p>
                {wallet && (
                  <p className="mt-1 flex items-center gap-1.5 text-[12px] text-muted">
                    <WalletBadge kind={wallet.kind} size={16} /> {shortAddress(wallet.address)}
                    {wallet.demo && " (demo)"}
                  </p>
                )}
              </div>
            </div>

            <label className="mt-5 block">
              <span className="px-1 text-[13px] font-semibold text-muted">Name or nickname</span>
              <input autoFocus value={name} onChange={(e) => setName(e.target.value.slice(0, 40))} placeholder="e.g. Riley Stone, or just Riley" autoComplete="name" className={`mt-1 ${field}`} />
            </label>

            <label className="mt-3 block">
              <span className="px-1 text-[13px] font-semibold text-muted">Username</span>
              <span className={`mt-1 flex items-center gap-1 ${field}`}>
                <span className="text-muted">@</span>
                <input
                  value={shownHandle}
                  onChange={(e) => {
                    setHandleEdited(true);
                    setHandle(clean(e.target.value).slice(0, 20));
                  }}
                  placeholder="yourname"
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck={false}
                  className="w-full bg-transparent outline-none"
                />
                {validHandle && !taken && <Check size={20} className="shrink-0 text-money" />}
              </span>
            </label>
            <p className={`mt-1.5 px-1 text-[13px] ${validHandle && !taken ? "text-money" : shownHandle && (taken || !validHandle) ? "text-down" : "text-muted"}`}>{handleMessage}</p>
            {taken && ideas.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2">
                {ideas.map((idea) => (
                  <button
                    key={idea}
                    type="button"
                    onClick={() => {
                      setHandleEdited(true);
                      setHandle(idea);
                    }}
                    className="h-9 rounded-full bg-white px-3.5 text-[14px] font-semibold"
                  >
                    @{idea}
                  </button>
                ))}
              </div>
            )}

            <div className="mt-3">
              <span className="px-1 text-[13px] font-semibold text-muted">Country</span>
              <button type="button" onClick={() => setCountryOpen(true)} className={`mt-1 flex items-center gap-3 text-left ${field}`}>
                {country ? <span className="text-[22px] leading-none">{flagOf(country)}</span> : <Globe2 size={20} className="text-muted" />}
                <span className={`flex-1 ${country ? "" : "text-muted"}`}>{country ? countryName(country) : "Pick your country"}</span>
                <ChevronRight size={18} className="text-muted" />
              </button>
              <p className="mt-1.5 px-1 text-[13px] leading-snug text-muted">Shows as a flag by your name, so friends can tell you apart from look-alikes. Optional.</p>
            </div>

            <div className="flex-1" />
            <PrimaryButton className="mt-5" disabled={!ready} onClick={create}>
              Create my account
            </PrimaryButton>

            <Sheet open={countryOpen} onClose={() => setCountryOpen(false)} title="Where are you based?">
              <label className="flex h-12 items-center gap-2 rounded-full bg-chip px-4">
                <Search size={18} className="text-muted" />
                <input value={countryQuery} onChange={(e) => setCountryQuery(e.target.value)} placeholder="Search countries" className="w-full bg-transparent text-[16px] outline-none placeholder:text-muted" />
              </label>
              {!q && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {POPULAR_COUNTRIES.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => {
                        setPickedCountry(c);
                        setCountryOpen(false);
                      }}
                      className={`flex h-9 items-center gap-1.5 rounded-full px-3 text-[14px] font-semibold ${country === c ? "bg-brand text-white" : "bg-chip"}`}
                    >
                      <span className="text-[17px] leading-none">{flagOf(c)}</span> {countryName(c)}
                    </button>
                  ))}
                </div>
              )}
              <div className="mt-3 divide-y divide-line">
                {countryList.map(({ c, n }) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => {
                      setPickedCountry(c);
                      setCountryOpen(false);
                      setCountryQuery("");
                    }}
                    className="flex w-full items-center gap-3 py-3 text-left text-[16px]"
                  >
                    <span className="text-[22px] leading-none">{flagOf(c)}</span>
                    <span className="flex-1">{n}</span>
                    {country === c && <Check size={18} className="text-brand" />}
                  </button>
                ))}
                {countryList.length === 0 && <p className="py-6 text-center text-muted">No country matches “{countryQuery}”.</p>}
              </div>
              <button
                type="button"
                onClick={() => {
                  setPickedCountry("");
                  setCountryOpen(false);
                }}
                className="mt-2 h-12 w-full text-[15px] font-semibold text-muted"
              >
                Prefer not to say
              </button>
            </Sheet>
          </>
        )}

        {step === "done" && (
          <div className="flex flex-1 flex-col items-center justify-center text-center">
            <Confetti />
            <span className="pop relative">
              {preview(112)}
              <span className="absolute -bottom-1 -right-1 flex h-10 w-10 items-center justify-center rounded-full bg-money text-white ring-4 ring-page">
                <Check size={22} strokeWidth={3} />
              </span>
            </span>
            <h1 className="mt-6 flex items-center gap-2 text-[30px] font-semibold leading-[1.08] tracking-tight">
              You&apos;re in, @{shownHandle} <Flag code={country} size={26} />
            </h1>
            <p className="mt-3 text-[16px] leading-relaxed text-[#5b544a]">
              Anyone can now pay you by username, from anywhere. We added {usd(STARTER_DOLLARS)} and {usd(STARTER_ASSET_USD)} of {assetOf(STARTER_ASSET).name} to try it
              out (demo).
            </p>
            {wallet && (
              <p className="mt-3 flex items-center gap-2 rounded-full bg-white px-3 py-1.5 text-[13px] text-muted">
                <WalletBadge kind={wallet.kind} size={18} />
                {wallet.kind === "created" ? "New wallet" : WALLET_INFO[wallet.kind].name} · {shortAddress(wallet.address)}
              </p>
            )}
            <PrimaryButton className="mt-8" onClick={() => router.replace("/")}>
              Go to Home
            </PrimaryButton>
            <button type="button" onClick={() => router.replace("/friends")} className="mt-1 h-12 text-[16px] font-semibold text-brand">
              Find friends first
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function Spinner({ dark = false }: { dark?: boolean }) {
  return (
    <span
      aria-label="Connecting"
      className={`h-5 w-5 animate-spin rounded-full border-[2.5px] ${dark ? "border-[#0F2C4D]/25 border-t-[#0F2C4D]" : "border-brand/25 border-t-brand"}`}
    />
  );
}
