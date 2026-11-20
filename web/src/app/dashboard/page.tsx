"use client";

import { Activity, ExternalLink, Inbox, TriangleAlert, WifiOff } from "lucide-react";
import { useEffect, useState } from "react";
import { Card, EmptyState, PrimaryButton, SectionTitle } from "@/components/ui";
import { usd } from "@/lib/data";

const AGENT = process.env.NEXT_PUBLIC_AGENT_URL ?? "http://127.0.0.1:8787";
// Served from a public origin the agent is reached through an ngrok tunnel, and free
// ngrok answers a browser request with its own warning page unless this header is set.
// Harmless when AGENT is localhost, so it goes on every call.
const SKIP = { "ngrok-skip-browser-warning": "1" };
const EXPLORER = "https://explorer.testnet.arc.io/tx/";

type Market = { ticker: string; title: string; volume24h?: string; odds: { label: string; p: number }[] };
type Payment = { username: string; amount: string; memo: string; fn?: "sendAsAgent" | "propose" };
/** The owner's on-chain caps on the agent, in USDC base units. */
type Limits = { perSend: string; perDay: string; remaining: string };
type PlanResponse = {
  venue: { name: string };
  source: "live" | "partial" | "cache";
  markets: Market[];
  forecast: { day: string; covers: number; baseline: number; factors: { ticker: string; label: string; effect: number }[] };
  plan: { extraServers: number; extraCooks: number; unfilled: number; payments: Payment[]; supplier: Payment | null; limits?: Limits };
};
type Proposal = { id: string; user: string; token: string; to: string; toName: string; value: string; name: string; memo: string };
type FeedItem = { event: string; args: Record<string, string>; block: string; tx: string; logIndex: number };
type RunResponse = { live: boolean; results: { to: string; amount: string; fn: string; simulation: string; hash?: string }[] };

type Fetched<T> = { data?: T; error?: string };

/** GET from the agent server once, or every `every` ms. `bump` refetches on demand. Re-renders only when the body changed. */
function useAgent<T>(path: string, every = 0, bump = 0): Fetched<T> {
  const [state, setState] = useState<Fetched<T>>({});
  useEffect(() => {
    let alive = true;
    let last = "";
    const load = async () => {
      try {
        const r = await fetch(`${AGENT}${path}`, { headers: SKIP });
        const text = await r.text();
        if (!r.ok) throw new Error(`the agent server answered ${r.status}`);
        if (alive && text !== last) {
          last = text;
          setState({ data: JSON.parse(text) });
        }
      } catch (e) {
        const error = e instanceof TypeError ? `cannot reach the agent server at ${AGENT}` : (e as Error).message;
        if (alive) setState((s) => (s.error === error ? s : { data: s.data, error }));
      }
    };
    void load();
    const t = every ? setInterval(load, every) : undefined;
    return () => {
      alive = false;
      clearInterval(t);
    };
  }, [path, every, bump]);
  return state;
}

const dollars = (base: string) => usd(Number(base) / 1e6, { cents: false });
/** Token amounts: the native currency is 18 decimals, the USDC ERC-20 view is 6. */
const amountOf = (value: string, token?: string) => usd(Number(BigInt(value || "0")) / 10 ** (!token || /^0x0+$/.test(token) ? 18 : 6), { cents: false });
const short = (a: string) => `${a.slice(0, 6)}...${a.slice(-4)}`;

const SOURCE = { live: "Live", partial: "Partial", cache: "Cached" } as const;
const SOURCE_TITLE = { live: "Every Gemini query answered", partial: "Some Gemini queries failed", cache: "Gemini did not answer, showing the last response" } as const;

function Skeleton({ className }: { className: string }) {
  return <div className={`shimmer rounded-2xl ${className}`} aria-hidden />;
}

function Offline({ error }: { error: string }) {
  return <EmptyState icon={WifiOff} title="Agent offline" text={`${error}. Start it with npm run serve in agent/.`} />;
}

function Tonight({ plan }: { plan: Fetched<PlanResponse> }) {
  const d = plan.data;
  return (
    <section aria-label="Tonight">
      <SectionTitle
        right={
          d && (
            <span title={SOURCE_TITLE[d.source]} className="rounded-full bg-chip px-2.5 py-1 text-[12px] font-medium text-ink">
              Gemini: {SOURCE[d.source]}
            </span>
          )
        }
      >
        Tonight
      </SectionTitle>
      <Card className="min-h-48">
        {!d && !plan.error && <Skeleton className="h-40" />}
        {!d && plan.error && <Offline error={plan.error} />}
        {d && d.markets.length === 0 && <EmptyState icon={Activity} title="No markets tonight" text="Gemini has no game for a local team and no high-temperature market for today." />}
        {d && d.markets.length > 0 && (
          <ul className="divide-y divide-line">
            {d.markets.map((m) => (
              <li key={m.ticker} className="py-4 first:pt-0 last:pb-0">
                <p className="font-mono text-[12px] text-muted">{m.ticker}</p>
                <h3 className="text-[16px] font-semibold leading-snug">{m.title}</h3>
                <ul className="mt-2 space-y-1.5">
                  {m.odds.map((o) => (
                    <li key={o.label} className="flex items-center gap-3 text-[14px]">
                      <span className="w-32 shrink-0 truncate">{o.label}</span>
                      <span className="h-2 flex-1 overflow-hidden rounded-full bg-chip" aria-hidden>
                        <span className="block h-full rounded-full bg-brand" style={{ width: `${Math.round(o.p * 100)}%` }} />
                      </span>
                      <span className="tabular w-11 text-right font-semibold">{Math.round(o.p * 100)}%</span>
                    </li>
                  ))}
                </ul>
                <p className="mt-2 text-[13px] text-muted">24h volume {usd(Number(m.volume24h ?? 0), { cents: false })}</p>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </section>
  );
}

function Forecast({ plan }: { plan: Fetched<PlanResponse> }) {
  const f = plan.data?.forecast;
  const weekday = f && new Date(`${f.day}T00:00:00Z`).toLocaleDateString("en-US", { weekday: "long", timeZone: "UTC" });
  const pct = f && f.baseline ? Math.round(((f.covers - f.baseline) / f.baseline) * 100) : 0;
  return (
    <section aria-label="Forecast">
      <SectionTitle>Forecast</SectionTitle>
      <Card className="min-h-48">
        {!f && !plan.error && <Skeleton className="h-40" />}
        {!f && plan.error && <Offline error={plan.error} />}
        {f && (
          <>
            <p className="tabular text-[88px] font-bold leading-none tracking-tight text-brand">{f.covers}</p>
            <p className="mt-2 text-[17px] font-semibold">covers tonight</p>
            <p className="mt-0.5 text-[15px] text-muted">
              {f.baseline} on a normal {weekday}, {pct >= 0 ? "+" : ""}
              {pct}%
            </p>
            {f.factors.length === 0 ? (
              <p className="mt-4 text-[14px] text-muted">No markets moved the number, so this is the normal {weekday}.</p>
            ) : (
              <ul className="mt-4 divide-y divide-line border-t border-line">
                {f.factors.map((x) => (
                  <li key={x.ticker} className="flex items-center justify-between gap-3 py-3">
                    <span className="min-w-0">
                      <span className="block text-[15px] font-medium">{x.label}</span>
                      <span className="block truncate font-mono text-[12px] text-muted">{x.ticker}</span>
                    </span>
                    <span className={`tabular shrink-0 text-[15px] font-semibold ${x.effect >= 0 ? "text-money" : "text-down"}`}>
                      {x.effect >= 0 ? "+" : "-"}
                      {Math.abs(x.effect)} covers
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      </Card>
    </section>
  );
}

const pill = "inline-flex min-h-7 shrink-0 items-center rounded-full px-3 text-[13px] font-semibold";
const Pill = ({ fn }: { fn?: Payment["fn"] }) =>
  fn && (fn === "sendAsAgent" ? <span className={`${pill} bg-brand-soft text-brand`}>agent pays</span> : <span className={`${pill} bg-chip text-ink ring-1 ring-ink/30`}>needs your approval</span>);

/** The caps the contract enforces on the agent, and how much of today is left. */
function Budget({ limits }: { limits: Limits }) {
  const perDay = Number(limits.perDay);
  const spent = perDay - Number(limits.remaining);
  const used = perDay ? Math.min(100, Math.round((spent / perDay) * 100)) : 0;
  return (
    <div className="mt-4 rounded-2xl bg-chip p-3">
      <p className="flex items-baseline justify-between gap-3 text-[14px]">
        <span className="font-medium">Agent budget today</span>
        <span className="tabular font-semibold">
          {dollars(String(spent))} of {dollars(limits.perDay)} spent
        </span>
      </p>
      <span className="mt-2 block h-2 overflow-hidden rounded-full bg-white" aria-hidden>
        <span className="block h-full rounded-full bg-brand" style={{ width: `${used}%` }} />
      </span>
      <p className="mt-2 text-[13px] text-muted">The contract refuses anything over {dollars(limits.perSend)} in one send, or past the total for the day. Those come to you instead.</p>
    </div>
  );
}

function PlanSection({ plan }: { plan: Fetched<PlanResponse> }) {
  const p = plan.data?.plan;
  const [busy, setBusy] = useState(false);
  const [run, setRun] = useState<Fetched<RunResponse>>({});
  const doRun = async () => {
    setBusy(true);
    try {
      const r = await fetch(`${AGENT}/run?venue=austin-bar`, { method: "POST", headers: SKIP });
      const body = await r.json();
      setRun(r.ok ? { data: body } : { error: body.error ?? `the agent server answered ${r.status}` });
    } catch {
      setRun({ error: `cannot reach the agent server at ${AGENT}` });
    }
    setBusy(false);
  };
  // The deposit leads: it is over the per-send cap, so it is the proposal the owner approves.
  const rows = p ? [...(p.supplier ? [{ ...p.supplier, role: "Supplier deposit" }] : []), ...p.payments.map((x) => ({ ...x, role: "Shift contractor" }))] : [];
  return (
    <section aria-label="Plan">
      <SectionTitle>Plan</SectionTitle>
      <Card className="min-h-48">
        {!p && !plan.error && <Skeleton className="h-40" />}
        {!p && plan.error && <Offline error={plan.error} />}
        {p && (
          <>
            <p className="text-[17px] font-semibold">
              {p.extraServers} extra {p.extraServers === 1 ? "server" : "servers"} and {p.extraCooks} extra {p.extraCooks === 1 ? "cook" : "cooks"}
            </p>
            {p.unfilled > 0 && <p className="mt-1 text-[13px] text-muted">{p.unfilled} of those shifts have no named staff to pay.</p>}
            {p.limits && <Budget limits={p.limits} />}
            <ul className="mt-3 divide-y divide-line border-t border-line">
              {rows.map((x) => (
                <li key={x.username} className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 py-3">
                  <span>
                    <span className="block text-[15px] font-semibold">@{x.username}</span>
                    <span className="block text-[13px] text-muted">{x.role}</span>
                  </span>
                  <span className="flex items-center gap-3">
                    <span className="tabular text-[17px] font-semibold">{dollars(x.amount)}</span>
                    <Pill fn={x.fn} />
                  </span>
                </li>
              ))}
              {rows.length === 0 && <li className="py-3 text-[14px] text-muted">No payments tonight.</li>}
            </ul>
          </>
        )}
        <PrimaryButton className="mt-4" onClick={doRun} disabled={!p || busy}>
          {busy ? "Running..." : "Run the plan"}
        </PrimaryButton>
        <div aria-live="polite" className="mt-3">
          {run.error && (
            <p className="flex gap-2 rounded-2xl bg-chip p-3 text-[14px]">
              <TriangleAlert size={18} className="mt-0.5 shrink-0 text-down" />
              Run failed: {run.error}
            </p>
          )}
          {run.data && (
            <div className="rounded-2xl bg-chip p-3 text-[14px]">
              <p className="font-semibold">{run.data.live ? "Live run: transactions were sent." : "Dry run: nothing was sent. The agent server is not in live mode."}</p>
              <ul className="mt-2 space-y-2">
                {run.data.results.map((r, i) => (
                  <li key={i}>
                    <span className="font-semibold">@{r.to}</span> {usd(Number(r.amount), { cents: false })} via <span className="font-mono text-[13px]">{r.fn}</span>
                    <span className="block text-muted">simulation: {r.simulation}</span>
                    {r.hash && (
                      <a href={`${EXPLORER}${r.hash}`} target="_blank" rel="noreferrer" className="inline-flex min-h-11 items-center gap-1 font-semibold text-brand underline">
                        View transaction <ExternalLink size={14} aria-hidden />
                      </a>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </Card>
    </section>
  );
}

const button = "inline-flex h-11 min-w-11 items-center justify-center rounded-full px-5 text-[15px] font-semibold disabled:opacity-40";

function Approvals() {
  const [bump, setBump] = useState(0);
  const feed = useAgent<FeedItem[]>("/feed", 4000);
  // The inbox follows the chain: a new event at the top of the feed means a proposal may have arrived or been decided.
  const top = feed.data?.[0];
  const proposals = useAgent<Proposal[]>("/proposals", 0, bump + (top ? top.logIndex + Number(top.block) : 0));
  const [busy, setBusy] = useState<string>();
  const [said, setSaid] = useState<Record<string, string>>({});
  const decide = async (id: string, fn: "approve" | "reject") => {
    setBusy(id);
    let msg: string;
    try {
      const r = await fetch(`${AGENT}/${fn}`, { method: "POST", headers: { "content-type": "application/json", ...SKIP }, body: JSON.stringify({ id }) });
      const body = await r.json();
      msg = !r.ok ? `Not sent: ${body.error}` : body.live ? `${fn === "approve" ? "Approved" : "Rejected"}, ${body.status}` : `Checked, nothing sent: ${body.status}`;
      if (r.ok && body.live) setBump((b) => b + 1);
    } catch {
      msg = `Not sent: cannot reach the agent server at ${AGENT}`;
    }
    setSaid((s) => ({ ...s, [id]: msg }));
    setBusy(undefined);
  };
  const nameOf = (id: string) => proposals.data?.find((p) => p.id === id)?.toName;
  const who = (e: FeedItem) => (e.args.name ? `@${e.args.name}` : e.args.to ? (nameOf(e.args.id) ? `@${nameOf(e.args.id)}` : short(e.args.to)) : `Proposal #${e.args.id}`);

  return (
    <section aria-label="Approvals and activity">
      <SectionTitle>Approvals and activity</SectionTitle>
      <div className="grid gap-4 min-[900px]:grid-cols-2">
        <Card className="min-h-48">
          <h3 className="text-[17px] font-semibold">Waiting for you</h3>
          {!proposals.data && !proposals.error && <Skeleton className="mt-3 h-24" />}
          {!proposals.data && proposals.error && <Offline error={proposals.error} />}
          {proposals.data?.length === 0 && <EmptyState icon={Inbox} title="Nothing waiting for you" text="When the agent wants to pay more than your caps allow, the request lands here." />}
          <ul className="divide-y divide-line">
            {proposals.data?.map((p) => (
              <li key={p.id} className="py-4">
                <p className="flex items-baseline justify-between gap-3">
                  <span className="text-[15px] font-semibold">@{p.toName || p.name}</span>
                  <span className="tabular text-[17px] font-semibold">{amountOf(p.value, p.token)}</span>
                </p>
                <p className="mt-1 text-[14px] text-muted">{p.memo}</p>
                <div className="mt-3 flex gap-3">
                  <button type="button" disabled={busy === p.id} onClick={() => decide(p.id, "approve")} aria-label={`Approve proposal ${p.id} to @${p.toName || p.name}`} className={`${button} bg-brand text-white`}>
                    Approve
                  </button>
                  <button type="button" disabled={busy === p.id} onClick={() => decide(p.id, "reject")} aria-label={`Reject proposal ${p.id} to @${p.toName || p.name}`} className={`${button} bg-chip text-ink`}>
                    Reject
                  </button>
                </div>
                <p aria-live="polite" className="mt-2 min-h-5 text-[13px] text-muted">
                  {said[p.id]}
                </p>
              </li>
            ))}
          </ul>
        </Card>
        <Card className="min-h-48">
          <h3 className="text-[17px] font-semibold">Live feed</h3>
          {!feed.data && !feed.error && <Skeleton className="mt-3 h-24" />}
          {!feed.data && feed.error && <Offline error={feed.error} />}
          {feed.data?.length === 0 && <EmptyState icon={Activity} title="No activity yet" text="Payments and proposals appear here the moment the chain records them." />}
          {feed.error && feed.data && <p className="mt-1 text-[13px] text-muted">Feed paused, retrying. {feed.error}.</p>}
          {/* A fixed-height box, so a new event never moves the page. */}
          <ul className="mt-2 max-h-80 divide-y divide-line overflow-y-auto" tabIndex={0} aria-label="Live feed events">
            {feed.data?.map((e) => (
              <li key={`${e.tx}-${e.logIndex}`} className="py-3">
                <p className="flex items-baseline justify-between gap-3">
                  <span className="text-[15px] font-semibold">
                    {e.event} <span className="font-normal text-muted">{who(e)}</span>
                  </span>
                  {e.args.value && <span className="tabular text-[15px] font-semibold">{amountOf(e.args.value, e.args.token)}</span>}
                </p>
                {e.args.memo && <p className="mt-0.5 text-[14px] text-muted">{e.args.memo}</p>}
                {e.args.byAgent === "true" && <p className="text-[13px] text-muted">paid by the agent</p>}
                {e.tx && (
                  <a href={`${EXPLORER}${e.tx}`} target="_blank" rel="noreferrer" className="inline-flex min-h-11 items-center gap-1 text-[14px] font-semibold text-brand underline">
                    View transaction <ExternalLink size={14} aria-hidden />
                  </a>
                )}
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </section>
  );
}

export default function Dashboard() {
  const plan = useAgent<PlanResponse>("/plan?venue=austin-bar");
  const d = plan.data;
  const day = d && new Date(`${d.forecast.day}T00:00:00Z`).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", timeZone: "UTC" });
  return (
    <main className="dash mx-auto w-full max-w-[1100px] px-4 pb-12 pt-6">
      <header className="px-1">
        <h1 className="min-h-9 text-[30px] font-semibold leading-tight tracking-tight">{d?.venue.name ?? "Stableplan"}</h1>
        <p className="min-h-6 text-[16px] text-muted">{day}</p>
      </header>
      <div className="grid gap-x-6 min-[900px]:grid-cols-2">
        <div className="min-[900px]:row-span-2">
          <Tonight plan={plan} />
        </div>
        <Forecast plan={plan} />
        <PlanSection plan={plan} />
        <div className="min-[900px]:col-span-2">
          <Approvals />
        </div>
      </div>
    </main>
  );
}
