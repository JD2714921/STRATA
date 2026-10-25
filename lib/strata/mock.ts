import type {
  Watchlist,
  MarketEvent,
  MarketSnapshot,
  ProbabilityResult,
  Provenance,
  SystemLog,
  DecisionState,
} from "./types";
export const provenance: Provenance = {
  kind: "Source fact",
  source: "STRATA illustrative seed",
  asOf: "2026-09-10T12:00:00Z",
  demo: true,
  freshness: "Historical",
};
import {
  InstrumentRegistry,
  watchlists as configuredWatchlists,
  groups,
} from "./registry";
import { historicalEvents, corpusReport } from "./historical";
export const watchlists: Watchlist[] = [
  {
    id: "All historical markets",
    name: "All historical markets",
    instruments: [],
    purpose: "Complete historical Corpus including unmapped source references",
    active: true,
    sortOrder: -1,
  },
  ...configuredWatchlists,
];
export { InstrumentRegistry, groups };
export const events = historicalEvents;
const rows = [
  [
    "US inflation surprise",
    "United States",
    "United States",
    38.9,
    -77,
    "Inflation",
    "Confirmed",
    "Risk-off",
    "London",
    "2026-09-10T12:30:00Z",
    "A fictional upside inflation surprise places rates-sensitive markets in focus.",
  ],
  [
    "ECB policy decision",
    "Europe",
    "Germany",
    50.1,
    8.7,
    "Monetary Policy",
    "Pending",
    "Transition",
    "London",
    "2026-09-10T12:15:00Z",
    "A sample policy decision links European rates, currency and equity exposure.",
  ],
  [
    "Energy supply disruption",
    "Middle East",
    "Saudi Arabia",
    24.7,
    46.7,
    "Geopolitical",
    "Developing",
    "Risk-off",
    "New York",
    "2026-09-10T10:00:00Z",
    "An illustrative supply disruption raises cross-market energy sensitivity.",
  ],
  [
    "Bank of Japan outlook",
    "Japan",
    "Japan",
    35.7,
    139.7,
    "Monetary Policy",
    "Uncertain",
    "Transition",
    "Asia",
    "2026-09-09T03:00:00Z",
    "A fictional policy outlook tests currency and index confirmation.",
  ],
  [
    "UK employment release",
    "United Kingdom",
    "United Kingdom",
    51.5,
    -0.1,
    "Employment",
    "Confirmed",
    "Range-bound",
    "London",
    "2026-09-08T06:00:00Z",
    "Sample employment data provides a sterling-focused event context.",
  ],
  [
    "China growth revision",
    "China",
    "China",
    39.9,
    116.4,
    "Growth",
    "Historical",
    "Risk-on",
    "Asia",
    "2026-08-14T02:00:00Z",
    "An illustrative growth revision connects industrial demand with global risk appetite.",
  ],
  [
    "Brazil commodity outlook",
    "Emerging Markets",
    "Brazil",
    -15.8,
    -47.9,
    "Commodity",
    "Historical",
    "Risk-on",
    "New York",
    "2026-07-20T13:00:00Z",
    "A fictional commodity outlook supplies a historical comparison case.",
  ],
  [
    "US liquidity repricing",
    "United States",
    "United States",
    40.7,
    -74,
    "Liquidity",
    "Historical",
    "Risk-off",
    "New York",
    "2025-10-08T14:00:00Z",
    "Sample historical liquidity repricing with mixed follow-through.",
  ],
];
export const demoEvents: MarketEvent[] = rows.map((r, i) => ({
  id: "DEMO_EVT_" + (i + 1),
  title: String(r[0]),
  region: String(r[1]),
  country: String(r[2]),
  lat: Number(r[3]),
  lon: Number(r[4]),
  type: String(r[5]),
  state: String(r[6]),
  regime: r[7] as MarketEvent["regime"],
  session: String(r[8]),
  date: String(r[9]),
  importance: i % 3 === 0 ? "High" : "Medium",
  assets:
    i === 2
      ? ["BRENT_CASH", "SPX"]
      : i === 3
        ? ["NK225"]
        : i === 4
          ? ["GBPUSD"]
          : ["SPX", "EURO50"],
  confidence: { score: 82 - i * 4, level: i < 4 ? "High" : "Medium" },
  provenance,
  summary: String(r[10]),
  before:
    "Illustrative pre-event context: range compression and elevated event sensitivity.",
  reaction: [
    {
      window: "Immediate · 1h",
      instrumentId: InstrumentRegistry[i % 6].id,
      direction: i % 2 ? "Up" : "Down",
      change: i % 2 ? 0.7 : -1.2,
      followThrough: i % 2 ? "Continuation" : "Mixed",
      provenance: { ...provenance, kind: "Calculated" },
    },
  ],
  notes:
    "Seed record only. Source documents, extraction citations and confirmed fields will be supplied in Round 2.",
}));
export function mockSnapshots(revision?: number): MarketSnapshot[];
export function mockSnapshots(): MarketSnapshot[] {
  return InstrumentRegistry.map((m) => ({
    instrumentId: m.id,
    price: {
      instrumentId: m.id,
      price: null,
      change: null,
      provenance: {
        ...provenance,
        source: "Not connected",
        freshness: "Stale",
        demo: false,
      },
    },
    htfBias: "Unknown",
    regime: "Unknown",
    volatility: "Unknown",
    smt: "Insufficient Data",
    ict: {
      state: "Rules captured · awaiting evidence",
      ruleIds: ["EXEC_2M", "THESIS_10M", "FVG_10M_LQ"],
      observations: [],
    },
    elasticity: null,
    confidence: { score: null, level: "Unknown" },
    stance: "Stand Aside",
    next: "Supply verified price, 10m+ thesis and aligned correlation evidence",
    session:
      m.region === "Japan" || m.region === "China"
        ? "Asia"
        : m.region === "United States"
          ? "New York"
          : "London",
  }));
}
export const probabilities: ProbabilityResult[] = [
  "Risk-off + USD strength",
  "Policy surprise + elevated volatility",
  "Growth revision + risk-on",
  "Liquidity shock + prior uptrend",
].map((condition, i) => ({
  condition,
  dimension: "Event type",
  matches: [42, 28, 19, 34][i],
  continuation: [64, 53, 68, 41][i],
  reversal: [21, 31, 18, 39][i],
  mixed: [15, 16, 14, 20][i],
  confidence: { score: 75 - i * 5, level: "Medium" },
  provenance: { ...provenance, kind: "Calculated" },
}));
export const decision: DecisionState = {
  stance: "Stand Aside",
  why: [
    "Event risk remains unresolved.",
    "Cross-market evidence is incomplete.",
    "Your Stage 1 rules are captured; live evidence is not connected.",
  ],
  supporting: [
    "Owner rules · five traded instruments",
    "Owner rules · 10m+ thesis, 2m execution",
  ],
  against: [
    "SMT · no verified directional evidence",
    "HTF · no verified screenshot",
    "RSI / ATR · settings unresolved",
    "Elasticity · not configured",
  ],
  invalidation:
    "Reassess when verified market data, HTF context and your rules agree.",
  next: "Review the next event and confirm the higher-timeframe structure.",
  confidence: { score: null, level: "Unknown" },
  demo: false,
};
export const initialLogs: SystemLog[] = [
  ...Object.entries(corpusReport.years).map(([year, count]) => ({
    id: "ingestion-" + year,
    timestamp: events.find((e) => e.date.startsWith(year))!.historical!
      .ingestedAt,
    type: "Data" as const,
    source: year + ".txt",
    action: count + " historical records ingested",
    instrument: null,
    previousState: null,
    newState: "Unverified user-supplied",
    confidence: null,
    status: "Complete" as const,
    details:
      "Original JSON, source references, middle-circle expectations and outer-circle outcomes preserved. Elasticity remains null. Idempotent source-versioned ingestion.",
  })),
  {
    id: "seed-1",
    timestamp: provenance.asOf,
    type: "System",
    source: "Stage 1 rulebook",
    action: "Owner rules and instruments registered",
    instrument: null,
    previousState: null,
    newState: "Rules captured",
    confidence: null,
    status: "Complete",
    details:
      "Five traded cash instruments and 42 context instruments registered, including required USDSGD. Eight event fixtures remain illustrative. No execution connection is active.",
  },
];
