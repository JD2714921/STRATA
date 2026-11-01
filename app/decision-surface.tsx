"use client";

import { useEffect, useState } from "react";
import round2 from "@/data/round2/manifest.json";
import probes from "@/data/round1/source-policy-receipts.json";
import { operationsViewSchema } from "@/lib/operations/view";
import type { StrataAssessment } from "@/lib/strata-v2/contracts";
import { CMC_DELAYED_QUOTE, PROVIDER_RESEARCH_AS_OF, RESEARCH_EVENTS, RESEARCH_NEWS } from "@/lib/strata-v2/providers";
import { TRADE_INSTRUMENTS } from "@/lib/strata-v2/registry";
import { sessionAt } from "@/lib/strata-v2/rules";
import { CMC_EXECUTION_PRODUCTS } from "@/lib/strata-v2/source-policy";
import { fmt } from "./format";

/**
 * Presentation only. `evaluateReadiness` and the confluence engine are unchanged.
 * This view never turns a gate result into an order, and it never calculates E_d.
 */
export type Situation = "no-setup" | "unconfirmed" | "prohibited";
export type VerdictLabel = "STAND DOWN" | "CAUTION";

const SITUATION_COPY: Record<Situation, { title: string; detail: string }> = {
  "no-setup": {
    title: "No setup exists",
    detail: "There is no entry, stop or target on this check. Standing down is the conclusion.",
  },
  unconfirmed: {
    title: "A direction exists, and it is not confirmed",
    detail: "Caution records an incomplete view. It is not an executable BUY or SELL.",
  },
  prohibited: {
    title: "A setup is prohibited",
    detail: "A hard restriction or an unresolved execution product blocks the instrument.",
  },
};

export const CHART_FRAMES = [
  { value: "2", label: "2m execution" },
  { value: "5", label: "5m execution" },
  { value: "15", label: "15m directional context" },
  { value: "60", label: "1H+ context" },
  { value: "120", label: "2H+ holding context" },
  { value: "1440", label: "1 day context" },
] as const;

const OVERLAYS = [
  ["Liquidity sweeps", "Not drawn. No approved detection is attached to this series."],
  ["Retest zones", "Not drawn. A retest is not observed on the current readiness check."],
  ["FVG / IFVG", "Not drawn. Gap rules remain unapproved and optional."],
  ["Pivots and market structure", "Not drawn. Pivot and structure methods are unconfigured."],
  ["ATR(9) on 5m", "Research definition. This panel does not recompute it."],
  ["ATR(14) on 15m", "Research definition. This panel does not recompute it."],
  ["ATR(27) on 1H+", "Research definition. This panel does not recompute it."],
  ["Session markers", "London entry windows are 08:00–10:00 and 14:00–16:30, end exclusive. The calendar is not cleared."],
  ["Economic-event markers", "Not drawn. The research calendar is a bounded snapshot, not a live feed."],
  ["Correlation / divergence", "Not drawn here. Stored comparisons stay in the historical journal."],
] as const;

export const CIRCLE_NOTES = {
  watch: {
    id: "watch",
    kicker: "Smallest circle",
    title: "Watchlist",
    finding: "Five CMC cash products are the execution universe. The wider list is context only and cannot be traded from this screen.",
    support: "The owner allowlist names Gold, Silver, Sugar Raw, Crude Oil and US NDAQ 100 cash.",
    contradiction: "Being on the watchlist is not confluence and does not grant eligibility.",
    history: "Geography and imported narratives stay in Atlas and Memory. They are not a live cross-asset score.",
    sources: `Registry and source policy. Research snapshot ${fmt(PROVIDER_RESEARCH_AS_OF)}.`,
    missing: "Current prices, correlations, liquidity and volatility are not attached to this readiness check.",
  },
  news: {
    id: "news",
    kicker: "Middle circle",
    title: "News and expectations",
    finding: "The visible calendar is a bounded research snapshot. Records are marked not current.",
    support: "Each retained item keeps its publisher, link and receipt time. Consensus figures stay provider-reported.",
    contradiction: "Expected and observed price responses on these records are null. A headline is not a frozen expectation.",
    history: "Imported event narratives remain unverified and are not pooled into a probability.",
    sources: `Bigdata research snapshot, received with the provider payload. As of ${fmt(PROVIDER_RESEARCH_AS_OF)}.`,
    missing: "A live economic calendar, monetary-policy feed, vintage-verified consensus and news blackout clearance.",
  },
  behaviour: {
    id: "behaviour",
    kicker: "Largest circle",
    title: "Observable human behaviour",
    finding: "No current behavioural proxy is attached. Opening patterns, failed breakouts and retests are not observed here.",
    support: "None supplied for this workspace check.",
    contradiction: "None supplied. Absence of a contradiction is not confirmation.",
    history: "Corpus outer-circle text is a supplied narrative, not a measured order-flow series.",
    sources: "No behavioural source timestamp is attached to the current gate check.",
    missing: "Liquidity reaction, session open behaviour, retest and failed-breakout evidence.",
  },
} as const;

function productFacts(id: string) {
  const policy = CMC_EXECUTION_PRODUCTS.find((product) => product.id === id);
  const probe = probes.products.find((row) => row.query === policy?.name);
  const labelMatched = !!policy && !!probe?.matches.some((match) => match.name === policy.name);
  const sellOnly = !!policy && policy.sides.length === 1 && policy.sides[0] === "SELL";
  return {
    policy,
    labelMatched,
    sellOnly,
    blocked: !!policy && !labelMatched,
    sides: policy?.sides.join(" / ") ?? "Unknown",
  };
}

export function presentAssessment(assessment: StrataAssessment) {
  const facts = productFacts(assessment.instrumentId);
  const failed = assessment.gates.filter((gate) => gate.state === "fail");
  const unknown = assessment.gates.filter((gate) => gate.state === "unknown");
  const passed = assessment.gates.filter((gate) => gate.state === "pass");
  const hardBan = failed.some((gate) => gate.id === "allowlist" || gate.id === "nq-side" || gate.id === "lab-isolation");
  const situation: Situation = facts.blocked || hardBan ? "prohibited" : assessment.direction === "Bullish" || assessment.direction === "Bearish" ? "unconfirmed" : "no-setup";
  const verdict: VerdictLabel = situation === "unconfirmed" ? "CAUTION" : "STAND DOWN";
  return { ...facts, failed, unknown, passed, situation, verdict, canSubmitOrder: assessment.canSubmitOrder };
}

function instrumentName(id: string) {
  return TRADE_INSTRUMENTS.find((instrument) => instrument.id === id)?.ownerLabel ?? id;
}

export function CommandBar({
  now,
  storage,
  connected,
  running,
  onReload,
}: {
  now: string | null;
  storage: string;
  connected: boolean;
  running: boolean;
  onReload: () => void;
}) {
  const session = now ? sessionAt(now) : null;
  return (
    <section className="command-bar" aria-label="Strata command">
      <div className="command-id">
        <span className="eyebrow">Strata</span>
        <strong>Command</strong>
        <small>Research workspace · no order path</small>
      </div>
      <dl className="command-grid">
        <div>
          <dt>Workspace clock</dt>
          <dd>{session ? `${session.localTime} London` : "Unknown"}</dd>
          <small>{session?.window ? `Inside ${session.window}` : "Outside the entry windows"} · Europe/London · calendar not cleared</small>
        </div>
        <div>
          <dt>{running ? "Read in progress" : "Last workspace read"}</dt>
          <dd>{running ? "Checking private storage" : storage}</dd>
          <small>A workspace reload does not refresh broker prices.</small>
        </div>
        <div>
          <dt>Source freshness</dt>
          <dd>{connected ? "Private storage connected" : "Disconnected"}</dd>
          <small>Research snapshot {fmt(PROVIDER_RESEARCH_AS_OF)}. Not a live feed.</small>
        </div>
        <div>
          <dt>Execution restrictions</dt>
          <dd>Stand down by default</dd>
          <small>NDAQ sell only · Sugar and Crude blocked · delayed CMC prices cannot confirm a 2m/5m entry</small>
        </div>
      </dl>
      <button className="secondary" type="button" disabled={running} onClick={onReload}>
        Reload workspace
      </button>
    </section>
  );
}

export function VerdictPanel({ assessment, onOpenTape }: { assessment: StrataAssessment; onOpenTape: () => void }) {
  const view = presentAssessment(assessment);
  const tone = view.verdict === "CAUTION" ? "caution" : "stand";
  return (
    <section className={`verdict verdict-${tone}`} aria-label="Primary decision">
      <div className="verdict-main">
        <span className="eyebrow">Current gate check · {instrumentName(assessment.instrumentId)}</span>
        <h2 className={`verdict-word tone-${tone}`}>{view.verdict}</h2>
        <p className="situation">{SITUATION_COPY[view.situation].title}. {SITUATION_COPY[view.situation].detail}</p>
        <p>
          Direction {assessment.direction}. Evidence {assessment.evidenceHealth}. Readiness {assessment.readiness}. Orders {assessment.canSubmitOrder ? "enabled" : "disabled"}.
        </p>
        <p className="muted">
          Evaluated at {fmt(assessment.evaluatedAt)} from the workspace clock. This is not a saved scheduled assessment, and it is not a live quote.
        </p>
        <button className="text-button" type="button" onClick={onOpenTape}>Open the chart workspace</button>
      </div>
      <div className="evidence-columns">
        <div>
          <h3>Supporting</h3>
          {view.passed.length ? <ul>{view.passed.slice(0, 4).map((gate) => <li key={gate.id}>{gate.name}</li>)}</ul> : <p>No supporting gate has cleared.</p>}
        </div>
        <div>
          <h3>Contradictory</h3>
          {assessment.against.length ? <ul>{assessment.against.slice(0, 4).map((item) => <li key={item}>{item}</li>)}</ul> : <p>No contradictory observation is attached.</p>}
        </div>
        <div>
          <h3>Missing confirmation</h3>
          {view.unknown.length ? <ul>{view.unknown.slice(0, 4).map((gate) => <li key={gate.id}>{gate.name}</li>)}</ul> : <p>No missing confirmation is listed.</p>}
        </div>
        <div>
          <h3>Invalidation and data quality</h3>
          <p>{assessment.invalidation}</p>
          <p>Data state: {assessment.evidenceHealth}. {view.sellOnly ? "BUY is prohibited on US NDAQ 100 cash." : ""} {view.blocked ? "Exact product lookup did not match." : view.labelMatched ? "Exact label matched; runtime basis is still unverified." : ""}</p>
        </div>
      </div>
    </section>
  );
}

export function FiveMarkets({
  assessments,
  selected,
  onSelect,
}: {
  assessments: readonly StrataAssessment[];
  selected: string;
  onSelect: (id: string) => void;
}) {
  return (
    <div className="market-grid" role="list">
      {TRADE_INSTRUMENTS.map((instrument, index) => {
        const assessment = assessments.find((item) => item.instrumentId === instrument.id);
        if (!assessment) return null;
        const view = presentAssessment(assessment);
        const className = ["market-card", selected === instrument.id ? "selected" : "", view.blocked ? "blocked" : "", view.sellOnly ? "restricted" : ""].filter(Boolean).join(" ");
        return (
          <button key={instrument.id} type="button" className={className} aria-pressed={selected === instrument.id} onClick={() => onSelect(instrument.id)}>
            <div className="card-top">
              <span>0{index + 1}</span>
              <span className={`pill ${view.verdict === "CAUTION" || view.blocked ? "amber" : ""}`}>{view.verdict}</span>
            </div>
            <h3>{instrument.ownerLabel}</h3>
            {view.sellOnly && <p className="restriction-row">SELL ONLY. An executable BUY is not shown.</p>}
            {view.blocked && <p className="restriction-row">Unavailable until the exact CMC cash product is mapped.</p>}
            <span className="market-price num">— <small>Current price unavailable</small></span>
            {instrument.id === "SILVER_CASH" && (
              <p className="dated-quote">
                Delayed receipt, {CMC_DELAYED_QUOTE.delay_minutes}m, not live, entry ineligible.
                <b className="num">{CMC_DELAYED_QUOTE.midPrice} {CMC_DELAYED_QUOTE.currency} mid</b>
                <small>Observed {fmt(CMC_DELAYED_QUOTE.observedAt)} · received {fmt(CMC_DELAYED_QUOTE.receivedAt)} · {CMC_DELAYED_QUOTE.price_status}</small>
              </p>
            )}
            <dl>
              <dt>Price time</dt><dd>{instrument.id === "SILVER_CASH" ? "Delayed receipt only" : "None"}</dd>
              <dt>Session move</dt><dd>Unavailable</dd>
              <dt>Structure</dt><dd>{assessment.direction}</dd>
              <dt>ATR</dt><dd>Not on this check</dd>
              <dt>Elastication</dt><dd>Unavailable</dd>
              <dt>Three circles</dt><dd>{SITUATION_COPY[view.situation].title}</dd>
              <dt>Eligibility</dt><dd>Not eligible</dd>
              <dt>Side policy</dt><dd>{view.sides}</dd>
            </dl>
          </button>
        );
      })}
    </div>
  );
}

export function ElasticationPanel() {
  const definition = round2.qDefinition;
  const valid = round2.edValid;
  const unavailable = round2.edUnavailable;
  const total = valid + unavailable || 1;
  return (
    <section className="panel" aria-label="Directional Elastication">
      <div className="panel-heading">
        <div>
          <span className="eyebrow">Quantitative thesis · research</span>
          <h2>Directional Elastication</h2>
        </div>
        <span className="pill amber">Unavailable</span>
      </div>
      <p className="equation" aria-label="E sub d equals the absolute value of the percent change in Q sub d, divided by the percent change in price.">
        <span>E<sub>d</sub></span><span>=</span><span className="num">|(%ΔQ<sub>d</sub>) / (%ΔP)|</span>
      </p>
      <p>{definition.definition}</p>
      <div className="stat-grid">
        <div><span>Current E_d</span><strong>Unavailable</strong><small>{definition.reason}</small></div>
        <div><span>%ΔQ_d</span><strong>—</strong><small>No directional quantity</small></div>
        <div><span>%ΔP</span><strong>—</strong><small>No qualified price window</small></div>
        <div><span>Signed ratio</span><strong>—</strong><small>Retained only when both changes exist</small></div>
        <div><span>Stored valid windows</span><strong className="num">{valid}</strong><small>Historical research manifest</small></div>
        <div><span>Stored unavailable</span><strong className="num">{unavailable}</strong><small>Not a trade signal</small></div>
      </div>
      <div className="ed-meter" aria-label={`${valid} valid and ${unavailable} unavailable stored directional windows`}>
        <span className="valid" style={{ width: `${(valid / total) * 100}%` }} />
        <span className="unavailable" style={{ width: `${(unavailable / total) * 100}%` }} />
      </div>
      <dl className="definition-list">
        <dt>Q_d</dt><dd>{definition.kind}. Measured {definition.measured ? "yes" : "no"}. Proxy {definition.proxy ? "yes" : "no"}. Units {definition.units ?? "unavailable"}.</dd>
        <dt>Timeframe</dt><dd>No current observation window is attached.</dd>
        <dt>Source</dt><dd>Round 2 manifest generated {fmt(round2.generatedAt)}. Baseline {round2.baselineCommit.slice(0, 12)}.</dd>
        <dt>Validity</dt><dd>The ratio is not computed when quantity or price change is missing.</dd>
        <dt>Research status</dt><dd>Not approved for execution. Absolute E_d is not a BUY or SELL.</dd>
      </dl>
    </section>
  );
}

export function StandDownBrief({ assessment }: { assessment: StrataAssessment }) {
  const view = presentAssessment(assessment);
  const upcoming = RESEARCH_EVENTS.find((event) => event.kind === "economic");
  return (
    <section className="panel" aria-label="Why Strata is standing down">
      <div className="panel-heading">
        <div>
          <span className="eyebrow">Trader 3 · equal priority</span>
          <h2>Why this is {view.verdict.toLowerCase()}</h2>
        </div>
      </div>
      <div className="situation-switch" role="list">
        {(Object.keys(SITUATION_COPY) as Situation[]).map((key) => (
          <div key={key} className={key === view.situation ? "active" : ""} role="listitem">
            <b>{SITUATION_COPY[key].title}</b>
            <small>{key === view.situation ? "This check" : "Not this check"}</small>
          </div>
        ))}
      </div>
      <div className="evidence-columns">
        <div>
          <h3>Requirements that failed</h3>
          {view.failed.length ? <ul>{view.failed.map((gate) => <li key={gate.id}>{gate.reason}</li>)}</ul> : <p>No failed gate on this instrument. Missing inputs still prevent a setup.</p>}
        </div>
        <div>
          <h3>Circles</h3>
          <p>No circle has a measured conflict or a measured agreement. Circle size is not a weight.</p>
        </div>
        <div>
          <h3>Data, risk and retest</h3>
          <p>Evidence is {assessment.evidenceHealth}. Reward/risk is not estimated. No current retest is attached. The proposed 1:5 minimum is not a result.</p>
        </div>
        <div>
          <h3>What would need to change</h3>
          <ul>{assessment.nextConditions.slice(0, 4).map((item) => <li key={item}>{item}</li>)}</ul>
          <p className="muted">{upcoming ? `Nearest retained release: ${upcoming.title}, ${fmt(upcoming.eventAt)}. It does not clear a news blackout.` : "No release is attached."}</p>
        </div>
      </div>
    </section>
  );
}

export function NewsStrip() {
  const releases = RESEARCH_EVENTS.filter((event) => event.kind === "economic").slice(0, 4);
  return (
    <section className="panel" aria-label="News and macro">
      <div className="panel-heading">
        <div>
          <span className="eyebrow">Factual snapshot · not a live wire</span>
          <h2>News and macro</h2>
        </div>
        <span className="pill">Snapshot</span>
      </div>
      <p className="muted">Material items from the retained research payload. Strata has not added an interpretation. Expected price response is unavailable on every record.</p>
      <div className="news-grid">
        {releases.map((event) => (
          <article key={event.id} className="news-card">
            <span className="eyebrow">{event.country} · {event.kind}</span>
            <h3>{event.title}</h3>
            <p className="fact">Release {fmt(event.eventAt)} · {event.upstream}</p>
            <p>Expected {event.consensus ?? "—"} · Actual {event.actual ?? "—"} · Previous {event.previous ?? "—"} {event.unit ?? ""}</p>
            <p>{event.relevance}</p>
            <p className="muted">Instruments: {event.linkedInstrumentIds.join(", ") || "None linked"}. Provider link precision: {event.sourceUrlPrecision}.</p>
            <a href={event.sourceUrl} target="_blank" rel="noreferrer">Source</a>
          </article>
        ))}
        {RESEARCH_NEWS.map((item) => (
          <article key={item.id} className="news-card">
            <span className="eyebrow">Issuer statement · day precision</span>
            <h3>{item.title}</h3>
            <p className="fact">{item.summary}</p>
            <p className="interpretation">Strata interpretation: {item.interpretation ?? "none recorded"}.</p>
            <a href={item.sourceUrl} target="_blank" rel="noreferrer">Source · published {item.publishedAt}</a>
          </article>
        ))}
      </div>
    </section>
  );
}

const PREPARED = [
  ["01:15", "Overnight intelligence"],
  ["07:45", "London / European opening assessment"],
  ["10:15", "European session review"],
  ["13:30", "US data and pre-market assessment"],
  ["14:25", "US opening preparation"],
  ["16:45", "Intraday assessment and bookkeeping"],
  ["21:15", "US review and next-session preparation"],
] as const;

function textField(row: Record<string, unknown>, key: string) {
  const value = row[key];
  return typeof value === "string" && value.trim() ? value : null;
}

export function ScheduleStrip({ onOpenHealth }: { onOpenHealth: () => void }) {
  const [status, setStatus] = useState<"loading" | "ready" | "unavailable">("loading");
  const [detail, setDetail] = useState("");
  const [rows, setRows] = useState<{ time: string; name: string; status: string; next: string }[]>([]);
  const [saved, setSaved] = useState<string>("No successful assessment receipt is loaded.");
  const [changes, setChanges] = useState<string>("Changes since the previous assessment are not loaded.");
  const [failure, setFailure] = useState<string>("No failed-run field is loaded.");

  useEffect(() => {
    let active = true;
    fetch("/api/operations", { cache: "no-store" })
      .then(async (response) => {
        const body: unknown = await response.json();
        const parsed = operationsViewSchema.safeParse(body);
        if (!response.ok || !parsed.success) throw new Error("Operational status is unavailable until private access is connected.");
        if (!active) return;
        setRows(parsed.data.schedules.map((slot) => ({
          time: slot.time,
          name: slot.name,
          status: slot.status,
          next: fmt(slot.nextOccurrence.scheduledAt),
        })));
        setDetail(parsed.data.activation);
        const markets = parsed.data.latestAssessment && typeof parsed.data.latestAssessment === "object" && "markets" in parsed.data.latestAssessment
          ? parsed.data.latestAssessment.markets
          : null;
        if (Array.isArray(markets) && markets.length) {
          const labels = markets.flatMap((market) => {
            if (!market || typeof market !== "object") return [];
            const row = market as Record<string, unknown>;
            const name = textField(row, "label") ?? textField(row, "instrumentId");
            const decision = textField(row, "decision");
            return name && decision ? [`${name}: ${decision}`] : [];
          });
          setSaved(labels.length ? `Saved receipt · ${labels.join(" · ")}. Not a fresh executable signal.` : "A saved assessment exists. Open Data Health to inspect it.");
        }
        const delta = parsed.data.latestAssessment && typeof parsed.data.latestAssessment === "object" && "changesSincePrevious" in parsed.data.latestAssessment
          ? parsed.data.latestAssessment.changesSincePrevious
          : null;
        if (Array.isArray(delta)) {
          setChanges(delta.length ? `${delta.length} stored change rows. Inspect them in Data Health before treating them as current.` : "The saved receipt records no change rows.");
        }
        const failed = parsed.data.runs.find((run) => textField(run, "error") || (textField(run, "state") ?? "").toLowerCase().includes("fail"));
        if (failed) setFailure(`${textField(failed, "phase") ?? "Run"} · ${textField(failed, "state") ?? "state unknown"}${textField(failed, "error") ? ` · ${textField(failed, "error")}` : ""}`);
        else if (parsed.data.runs.length) setFailure(`${parsed.data.runs.length} run records loaded, with no error field on the newest scanned rows.`);
        setStatus("ready");
      })
      .catch((error: unknown) => {
        if (!active) return;
        setStatus("unavailable");
        setDetail(error instanceof Error ? error.message : "Operational status is unavailable.");
      });
    return () => {
      active = false;
    };
  }, []);

  return (
    <section className="panel" aria-label="Prepared assessment checkpoints">
      <div className="panel-heading">
        <div>
          <span className="eyebrow">Europe/London · GMT/BST · not a running scheduler</span>
          <h2>Assessment checkpoints</h2>
        </div>
        <button className="quiet" type="button" onClick={onOpenHealth}>Open job status</button>
      </div>
      <p>{status === "loading" ? "Loading operational status…" : detail} A listed next time is a prepared occurrence, not an unattended execution receipt. Spring 01:15 does not exist locally and is skipped. The autumn repeated hour is deduplicated.</p>
      <div className="table-scroll">
        <table className="schedule-table">
          <thead><tr><th>London</th><th>Prepared task</th><th>Registration</th><th>Next planned occurrence</th></tr></thead>
          <tbody>
            {(rows.length ? rows : PREPARED.map(([time, name]) => ({ time, name, status: status === "ready" ? "Loaded" : "Not verified", next: "Unavailable" }))).map((slot) => (
              <tr key={slot.time}><td className="num">{slot.time}</td><td>{slot.name}</td><td>{slot.status}</td><td>{slot.next}</td></tr>
            ))}
          </tbody>
        </table>
      </div>
      <dl className="definition-list">
        <dt>Latest success</dt><dd>{saved}</dd>
        <dt>Since previous</dt><dd>{changes}</dd>
        <dt>Last failure</dt><dd>{failure}</dd>
        <dt>Trading 212</dt><dd>Separate on-command refresh. Holdings are not CMC orders. Credentials are not shown here.</dd>
      </dl>
    </section>
  );
}

export function ChartNotes({ interval }: { interval: string }) {
  const frame = CHART_FRAMES.find((item) => item.value === interval);
  return (
    <section className="panel" aria-label="Chart overlays">
      <div className="panel-heading">
        <div>
          <span className="eyebrow">Validated overlay versus research note</span>
          <h2>{frame?.label ?? "Selected view"}</h2>
        </div>
      </div>
      <p>Candles appear only when a stored series matches this instrument and interval. Calculated structures are not drawn when the backend has not supplied them.</p>
      <ul className="overlay-list">
        {OVERLAYS.map(([name, note]) => (
          <li key={name}><b>{name}</b><span>{note}</span></li>
        ))}
      </ul>
    </section>
  );
}

export function TradeSetup({ assessment }: { assessment: StrataAssessment }) {
  const view = presentAssessment(assessment);
  const fields = ["Entry trigger", "Entry zone", "Stop-loss", "Invalidation level", "TP1", "TP2", "TP3", "Gross reward/risk", "Net reward/risk", "Relevant ATR", "15m+ directional evidence", "2m/5m execution confirmation", "Liquidity grab and retest", "News-event exposure"];
  return (
    <section className="panel" aria-label="Trade setup">
      <div className="panel-heading">
        <div>
          <span className="eyebrow">{instrumentName(assessment.instrumentId)} · owner approval required</span>
          <h2>{view.situation === "prohibited" ? "No trade card" : "Requirements still missing"}</h2>
        </div>
        <span className="pill amber">{view.verdict}</span>
      </div>
      {view.sellOnly && <p className="restriction-row">US NDAQ 100 cash is sell only. This panel does not offer an executable BUY.</p>}
      <p>Nothing below is a suggested order. Partial closes and stop movement are not automated. Suggestive TP ordering stays on the Rules screen and does not qualify reward/risk.</p>
      <div className="setup-grid">
        {fields.map((field) => (
          <div key={field}><span>{field}</span><b>Not attached</b></div>
        ))}
        <div><span>Source freshness</span><b>{assessment.evidenceHealth}</b></div>
        <div><span>Trade eligibility</span><b>Not eligible</b></div>
      </div>
      <h3>Failed</h3>
      {view.failed.length ? <ul>{view.failed.map((gate) => <li key={gate.id}>{gate.reason}</li>)}</ul> : <p>No failed gate. The missing confirmations below still block a setup.</p>}
      <h3>Missing</h3>
      <ul>{view.unknown.slice(0, 6).map((gate) => <li key={gate.id}>{gate.reason}</li>)}</ul>
    </section>
  );
}

