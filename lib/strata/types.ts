export type Stance =
  "Bullish" | "Bearish" | "Neutral" | "Stand Aside" | "Watch";
export type DataConfidence = {
  score: number | null;
  level: "High" | "Medium" | "Low" | "Unknown";
};
export type Provenance = {
  kind: "Source fact" | "Calculated" | "AI derived" | "User provided";
  source: string;
  asOf: string;
  demo: boolean;
  freshness: "Live" | "Current" | "Delayed" | "Stale" | "Historical";
};
export type Instrument = {
  id: string;
  symbol: string;
  name: string;
  assetClass: string;
  region: string;
  currency: string;
  traded: boolean;
  providerSymbol?: string | null;
  providerMapping?: string;
  instrumentKind?: string;
  notes?: string;
};
export type Watchlist = {
  id: string;
  name: string;
  instruments: string[];
  purpose: string;
  active: boolean;
  sortOrder: number;
};
export type MarketPrice = {
  instrumentId: string;
  price: number | null;
  change: number | null;
  provenance: Provenance;
};
export type MarketRegime =
  "Risk-off" | "Risk-on" | "Range-bound" | "Transition" | "Unknown";
export type SMTState =
  | "Confirming"
  | "Diverging"
  | "Neutral"
  | "Insufficient Data"
  | "Not Applicable";
export type ICTState = {
  state: string;
  ruleIds: string[];
  observations: string[];
};
export type MarketSnapshot = {
  instrumentId: string;
  price: MarketPrice;
  htfBias: Stance | "Unknown";
  regime: MarketRegime;
  volatility: string;
  smt: SMTState;
  ict: ICTState;
  elasticity: number | null;
  confidence: DataConfidence;
  stance: Stance;
  next: string;
  session: string;
};
export type EventReaction = {
  window: string;
  instrumentId: string;
  direction: string;
  change: number | null;
  followThrough: string;
  provenance: Provenance;
};
export type MarketEvent = {
  id: string;
  title: string;
  date: string;
  region: string;
  country: string;
  lat: number;
  lon: number;
  type: string;
  importance: "High" | "Medium" | "Low";
  state: string;
  assets: string[];
  regime: MarketRegime;
  confidence: DataConfidence;
  provenance: Provenance;
  summary: string;
  before: string;
  reaction: EventReaction[];
  notes: string;
  session: string;
  historical?: HistoricalIngestionRecord;
};
export type HistoricalAnalogue = {
  eventId: string;
  similarity: number;
  reason: string;
  elasticity: number | null;
};
export type ElasticityResult = {
  value: number | null;
  expected: number | null;
  observed: number | null;
  deviation: number | null;
  confidence: DataConfidence;
  percentile: number | null;
  breakdown: string[];
  status: "Demo" | "Not configured" | "Complete" | "Failed";
  provenance: Provenance;
};
export type ProbabilityResult = {
  condition: string;
  dimension: string;
  matches: number;
  continuation: number;
  reversal: number;
  mixed: number;
  confidence: DataConfidence;
  provenance: Provenance;
};
export type IndicatorSnapshot = {
  name: string;
  value: number | null;
  timeframe: string;
  provenance: Provenance;
};
export type HTFSnapshot = {
  id: string;
  instrumentId: string;
  timeframe: string;
  imageUrl: string | null;
  timestamp: string | null;
  source: string;
  status:
    | "No Screenshot"
    | "Current"
    | "Stale"
    | "Processing"
    | "Processed"
    | "Failed";
  bias: Stance;
  levels: number[];
  observations: string[];
  indicators: IndicatorSnapshot[];
  invalidation: string | null;
};
export type RelationshipGroup = {
  id: string;
  name: string;
  primaryInstrument: string;
  comparisonInstruments: string[];
  relationshipType: string;
  expectedBehaviour: string;
  timeframe: string;
  session: string;
  enabled: boolean;
  state: SMTState;
  reliability: number | null;
  notes: string;
};
export type TradingRule = {
  id: string;
  name: string;
  enabled: boolean;
  kind: "SMT" | "ICT" | "Execution" | "Indicator";
  description: string;
  parameters: Record<string, string | number | boolean>;
};
export type TradingPlan = {
  id: string;
  instrumentId: string;
  ruleIds: string[];
  invalidation: string;
  next: string;
  entryContext?: import("./rules").EntryContext;
};
export type DecisionState = {
  stance: Stance;
  why: string[];
  supporting: string[];
  against: string[];
  invalidation: string;
  next: string;
  confidence: DataConfidence;
  demo: boolean;
};
export type DataSource = {
  id: string;
  name: string;
  state: "Mock" | "Not connected" | "Ready" | "Failed";
  capabilities: string[];
};
export type RefreshJob = {
  id: string;
  startedAt: string;
  finishedAt: string | null;
  steps: {
    name: string;
    status: "Complete" | "Skipped" | "Failed";
    message: string;
  }[];
};
export type SystemLog = {
  id: string;
  timestamp: string;
  type: string;
  source: string;
  action: string;
  instrument: string | null;
  previousState: string | null;
  newState: string | null;
  confidence: number | null;
  status: string;
  details: string;
};
export type CalculationInput = {
  instrumentId: string;
  historicalPrice: number | null;
  currentPrice: number | null;
  eventPrice: number | null;
  baseline: number | null;
  timeframe: string;
  volatility: number | null;
  marketResponse: number | null;
  eventClassification: string;
  comparisonSample: string[];
  htfContext: string;
  variables: Record<string, number>;
};
export type HistoricalSourceRecord = {
  date_time_utc: string;
  location_name: string;
  latitude: number;
  longitude: number;
  title: string;
  description: string;
  instruments: string[];
  middle_circle: string;
  outer_circle: string;
  elasticity_value: number | null;
  relevance_score: number;
  sources: string[];
  notes: string | null;
};
export type HistoricalIngestionRecord = {
  id: string;
  batchId: string;
  sourceFile: string;
  sourceRow: number;
  sourceSha256: string;
  contentSha256: string;
  ingestedAt: string;
  verification: string;
  issues: string[];
  mappedInstrumentIds: string[];
  unmappedInstrumentReferences: string[];
  derivedRegion: string;
  derivedCountry: string;
  derivedCategory: string;
  classificationStatus: string;
  normalizedDateTimeUtc?: string;
  raw: HistoricalSourceRecord;
};
