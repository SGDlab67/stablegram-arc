"use client";

import { useRouter } from "next/navigation";
import { Copy, Eye, PenLine, ShieldAlert, ShieldCheck, WifiOff } from "lucide-react";
import { useMemo, useState } from "react";
import { BackHeader, Screen } from "@/components/shell";
import { Card, PrimaryButton } from "@/components/ui";
import { Confetti, haptic, toast } from "@/components/feel";
import { demoPhrase } from "@/lib/recovery";
import { useStore } from "@/lib/store";

/**
 * Back up the wallet: warn → reveal the 12 words → check three of them → done.
 * In the demo the words are random (see lib/recovery.ts); the real build shows the wallet's own phrase.
 */
export default function BackupPage() {
  const router = useRouter();
  const { backedUp, markBackedUp } = useStore();
  const [step, setStep] = useState<"intro" | "show" | "check" | "done">(backedUp ? "done" : "intro");
  const [justFinished, setJustFinished] = useState(false);
  // Made when the person asks to see them, never during page preparation.
  const [words, setWords] = useState<string[]>([]);
  const [revealed, setRevealed] = useState(false);
  // Ask for three positions, in order.
  const asks = useMemo(() => [2, 6, 10], []);
  const [answers, setAnswers] = useState<(string | null)[]>([null, null, null]);
  const options = useMemo(
    () =>
      asks.map((pos, k) => {
        const wrong = words.filter((_, i) => i !== pos).slice(k * 2, k * 2 + 2);
        const list = [words[pos], ...wrong];
        return k % 2 ? [...list].reverse() : [list[1], list[0], list[2]];
      }),
    [asks, words],
  );
  const allRight = answers.every((a, k) => a === words[asks[k]]);
  const anyWrong = answers.some((a, k) => a !== null && a !== words[asks[k]]);

  return (
    <Screen tabs={false}>
      <BackHeader title="Back up your wallet" fallback="/me/settings" />
      <div className="px-4 pb-10">
        {step === "intro" && (
          <>
            <div className="flex flex-col items-center px-4 pt-4 text-center">
              <span className="flex h-20 w-20 items-center justify-center rounded-[28%] bg-brand-soft text-brand">
                <ShieldCheck size={38} />
              </span>
              <h1 className="mt-4 text-[26px] font-semibold leading-tight tracking-tight">Your recovery phrase</h1>
              <p className="mt-2 text-[15px] leading-relaxed text-muted">
                12 words that can restore your wallet on any phone. If you lose your phone and Face ID, these words are the only way back in.
              </p>
            </div>
            <Card className="mt-5 space-y-3.5">
              {(
                [
                  [<PenLine key="p" size={18} />, "Write them on paper", "Keep it somewhere safe. A photo or a note on your phone is easy to steal."],
                  [<WifiOff key="w" size={18} />, "Never type them anywhere else", "Not in a website, a chat or an email. Real support never asks for them."],
                  [<ShieldAlert key="s" size={18} />, "Anyone with the words has the money", "We can't reset them for you. That's what makes the wallet yours."],
                ] as const
              ).map(([icon, h, t]) => (
                <div key={h} className="flex gap-3">
                  <span className="mt-0.5 text-brand">{icon}</span>
                  <p className="text-[14px] leading-snug">
                    <span className="block font-semibold">{h}</span>
                    <span className="text-muted">{t}</span>
                  </p>
                </div>
              ))}
            </Card>
            <PrimaryButton
              className="mt-6"
              onClick={() => {
                if (words.length === 0) setWords(demoPhrase(12));
                setStep("show");
              }}
            >
              I&apos;m somewhere private. Show me
            </PrimaryButton>
          </>
        )}

        {step === "show" && (
          <>
            <p className="px-1 pt-2 text-[15px] leading-relaxed text-muted">Write these down in order.</p>
            <div className="relative mt-3">
              <div className={`grid grid-cols-3 gap-2 transition ${revealed ? "" : "select-none blur-md"}`}>
                {words.map((w, i) => (
                  <div key={i} className="flex h-12 items-center gap-2 rounded-xl bg-white px-3">
                    <span className="w-5 text-right text-[12px] font-semibold text-muted">{i + 1}</span>
                    <span className={`text-[16px] font-semibold ${revealed ? "selectable" : ""}`}>{w}</span>
                  </div>
                ))}
              </div>
              {!revealed && (
                <button
                  type="button"
                  onClick={() => {
                    haptic();
                    setRevealed(true);
                  }}
                  className="no-press absolute inset-0 flex flex-col items-center justify-center gap-2 rounded-2xl text-[16px] font-semibold"
                >
                  <span className="flex h-12 w-12 items-center justify-center rounded-full bg-ink text-white">
                    <Eye size={22} />
                  </span>
                  Tap to reveal
                </button>
              )}
            </div>
            <button
              type="button"
              disabled={!revealed}
              onClick={() => {
                void navigator.clipboard?.writeText(words.join(" "));
                toast("Copied. Store it offline, then clear your clipboard.");
              }}
              className="mx-auto mt-3 flex h-10 items-center gap-1.5 rounded-full px-4 text-[14px] font-semibold text-muted disabled:opacity-40"
            >
              <Copy size={15} /> Copy (not recommended)
            </button>
            <p className="mt-1 text-center text-[12px] text-muted">Demo words. Not a real wallet.</p>
            <PrimaryButton className="mt-5" disabled={!revealed} onClick={() => setStep("check")}>
              I wrote them down
            </PrimaryButton>
          </>
        )}

        {step === "check" && (
          <>
            <p className="px-1 pt-2 text-[15px] leading-relaxed text-muted">Quick check, so a typo can&apos;t lock you out later.</p>
            <div className="mt-3 space-y-3">
              {asks.map((pos, k) => (
                <Card key={pos} className="!p-4">
                  <p className="text-[15px] font-semibold">Word #{pos + 1}</p>
                  <div className="mt-2 grid grid-cols-3 gap-2">
                    {options[k].map((opt) => {
                      const picked = answers[k] === opt;
                      const right = opt === words[pos];
                      return (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => {
                            haptic(right ? "tap" : "warn");
                            setAnswers((a) => a.map((x, j) => (j === k ? opt : x)));
                          }}
                          className={`h-11 rounded-xl text-[15px] font-semibold ${picked ? (right ? "bg-money text-white" : "shake bg-down text-white") : "bg-chip"}`}
                        >
                          {opt}
                        </button>
                      );
                    })}
                  </div>
                </Card>
              ))}
            </div>
            {anyWrong && (
              <button type="button" onClick={() => setStep("show")} className="mt-3 w-full text-center text-[14px] font-semibold text-down">
                Not quite. Look at your words again
              </button>
            )}
            <PrimaryButton
              className="mt-5"
              disabled={!allRight}
              onClick={() => {
                markBackedUp();
                haptic("success");
                setJustFinished(true);
                setStep("done");
              }}
            >
              Finish backup
            </PrimaryButton>
          </>
        )}

        {step === "done" && (
          <div className="flex flex-col items-center px-4 pt-10 text-center">
            {justFinished && <Confetti pieces={45} />}
            <span className="pop flex h-24 w-24 items-center justify-center rounded-full bg-money text-white">
              <ShieldCheck size={44} />
            </span>
            <h1 className="mt-5 text-[26px] font-semibold tracking-tight">Your wallet is backed up</h1>
            <p className="mt-2 text-[15px] leading-relaxed text-muted">Keep the paper safe. With it you can restore your wallet on any phone, even without Face ID.</p>
            <PrimaryButton className="mt-8" onClick={() => router.push("/me")}>
              Done
            </PrimaryButton>
          </div>
        )}
      </div>
    </Screen>
  );
}
