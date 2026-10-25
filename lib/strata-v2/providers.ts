import { z } from 'zod';
import payload from '../../data/round1/provider-ui.json';
import { deepFreeze, instantMs, type BarSeries, type ServiceResult } from './contracts';
import {assertMarketSource} from './source-policy';

/**
 * Bounded, authenticated chat reads captured during Round 1.
 * These immutable receipts are research artifacts, not a production feed or fixtures.
 * Raw provider IDs needed for CMC requests are deliberately absent.
 */
export const PROVIDER_REGISTRY_VERSION = 'R1-provider-discovery-2026-10-19';
const instant = z.string().refine(value => instantMs(value) !== null, 'Explicit timestamp required');
const nullableInstant = instant.nullable();
const sourceMode = z.literal('bounded-research-snapshot');
const providerSchema = z.object({
  id: z.string(), name: z.string(), role: z.string(),
  chatStatus: z.enum(['verified', 'available', 'not-connected']),
  status: z.enum(['verified', 'configured-untested', 'blocked', 'unsupported']),
  summary: z.string(), limitations: z.array(z.string()), lastVerifiedAt: nullableInstant,
  sourceIds: z.array(z.string()), sourceTypes: z.array(z.string()),
  researchOnly: z.literal(true),
  hosted: z.object({ eligible: z.null(), verified: z.literal(false), status: z.literal('not-tested'), note: z.string() }),
  unattended: z.object({ verified: z.literal(false), enabled: z.literal(false) }),
  refreshMode: z.literal('bounded chat-native read'), visitorConsent: z.literal('not-tested'),
});
const coverageSchema = z.object({
  id: z.string(), provider: z.string(), informationNeed: z.string(), connectorAction: z.string(),
  accountSecurityScope: z.string(), sourceFormat: z.string(), structured: z.boolean().nullable(),
  narrative: z.boolean(), availableIntervalHistory: z.string(),
  eventTimestamp: z.string().nullable(), receiptTimestamp: z.string().nullable(),
  entitlement: z.string(), observedTestResult: z.string(), readiness: z.string(),
  fallback: z.string(), nextRoundBlocker: z.string(), hostedSitesEligibility: z.string(),
  hostedReadVerified: z.literal(false), visitorConsent: z.string(),
  unattendedCapability: z.string(), refreshPath: z.string(),
  declaredDelay: z.union([z.string(), z.object({ minutes: z.number(), status: z.string() }), z.null()]),
  rateLimits: z.string().nullable(), costLimits: z.string().nullable(),
}).passthrough();
const eventSchema = z.object({
  id: z.string(), title: z.string(), kind: z.enum(['economic', 'corporate']),
  providerId: z.literal('bigdata'), upstream: z.string(), country: z.string(),
  eventAt: instant, period: z.string().nullable(), periodType: z.string().nullable(),
  impact: z.string().nullable(), consensus: z.number().finite().nullable(),
  actual: z.number().finite().nullable(), previous: z.number().finite().nullable(),
  unit: z.string().nullable(), potency: z.union([z.string(), z.number(), z.null()]),
  expectationType: z.enum(['calendar-only', 'provider-consensus']),
  expectedPriceResponse: z.null(), observedPriceResponse: z.null(),
  sourceId: z.string(), providerEventId: z.string().nullable(), sourceUrl: z.string().url(),
  sourceUrlPrecision: z.enum(['provider-homepage', 'company-calendar']),
  receivedAt: instant, firstSeenAt: z.null(), publishedAt: z.null(), freezeAt: instant,
  sourceMode, current: z.literal(false), fixture: z.literal(false),
  linkedInstrumentIds: z.array(z.string()), portfolioLabels: z.array(z.string()), relevance: z.string(),
});
const newsSchema = z.object({
  id: z.string(), title: z.string(), summary: z.string(), providerId: z.literal('bigdata'),
  upstream: z.string(), sourceId: z.string(), sourceUrl: z.string().url(),
  publishedAt: z.string(), publicationPrecision: z.literal('day'), distributedAt: instant,
  firstSeenAt: z.null(), receivedAt: instant, clusterId: z.string(),
  evidenceType: z.literal('issuer-statement'), portfolioLabels: z.array(z.string()),
  qualitativeTags: z.array(z.string()), current: z.literal(false), fixture: z.literal(false),
  independentConfirmations: z.null(), interpretation: z.null(),
});
const rawBarSchema = z.object({
  sourceTimestamp: instant, open: z.number().finite(), high: z.number().finite(),
  low: z.number().finite(), close: z.number().finite(),
  volume: z.null(), isClosed: z.null(), closed: z.null(),
}).superRefine((bar, context) => {
  if (bar.high < Math.max(bar.open, bar.close, bar.low) || bar.low > Math.min(bar.open, bar.close)) {
    context.addIssue({ code: z.ZodIssueCode.custom, message: 'Invalid source OHLC geometry' });
  }
});
const historicalBarSchema = z.object({
  id: z.string(), provider: z.literal('CMC Markets'), accountScope: z.string(),
  instrumentOwnerLabel: z.literal('Silver Cash'), brokerDisplayName: z.literal('Silver - Cash'),
  brokerWrapper: z.literal('SB'), mappingVersion: z.string(), mappingStatus: z.string(),
  currency: z.literal('USD'), basis: z.literal('mid'), units: z.string(),
  intervalSeconds: z.union([z.literal(120), z.literal(600)]),
  intervalMinutes: z.union([z.literal(2), z.literal(10)]),
  receivedAt: instant, declaredDelaySeconds: z.null(), timestampPrecision: z.literal('second'),
  timestampMeaning: z.string(), hostedFeed: z.literal(false), current: z.literal(false),
  fixture: z.literal(false), scope: z.string(), bars: z.array(rawBarSchema).min(1),
  sourceReceiptId: z.string(), state: z.literal('stale'),
}).superRefine((series, context) => {
  if (series.intervalSeconds !== series.intervalMinutes * 60) {
    context.addIssue({ code: z.ZodIssueCode.custom, message: 'Source interval mismatch' });
  }
  for (let i = 1; i < series.bars.length; i++) {
    const elapsed = Date.parse(series.bars[i].sourceTimestamp) - Date.parse(series.bars[i - 1].sourceTimestamp);
    if (elapsed !== series.intervalSeconds * 1000) {
      context.addIssue({ code: z.ZodIssueCode.custom, message: 'Non-consecutive source timestamps in bounded example' });
    }
  }
});
const positionSchema = z.object({
  id: z.string(), accountScope: z.string(), wrapper: z.literal('SB'),
  positionCountAtReceipt: z.literal(0), currentPositionCount: z.null(),
  observedAt: z.null(), receivedAt: instant, reconciled: z.literal(true),
  current: z.literal(false), sourceMode, note: z.string(),
});
const delayedQuoteSchema = z.object({
  time: instant, as_at: instant, bidPrice: z.string(), midPrice: z.string(), askPrice: z.string(),
  price_status: z.literal('delayed'), delay_minutes: z.literal(15), market_status: z.string(),
  price_state: z.string(), spread: z.object({ value: z.string(), status: z.literal('available') }),
  receivedAt: instant, observedAt: instant, instrumentOwnerLabel: z.literal('Silver Cash'),
  brokerDisplayName: z.literal('Silver - Cash'), wrapper: z.literal('SB'),
  currency: z.literal('USD'), units: z.null(), sourceId: z.string(),
  current: z.literal(false), fixture: z.literal(false), eligibleForEntry: z.literal(false),
});
const issuerSchema = z.object({
  id: z.string(), portfolioLabel: z.string(), providerId: z.literal('bigdata'),
  securityType: z.literal('COMPANY'), entityId: z.string(), sourceId: z.string(), upstream: z.string(),
  sourceUrl: z.string().url(), receivedAt: instant, reportingDate: z.string(), period: z.string(),
  currency: z.literal('USD'), epsBasis: z.null(), reportedEps: z.number().finite(),
  estimatedEps: z.number().finite(), reportedRevenue: z.number().finite(),
  estimatedRevenue: z.number().finite(), current: z.literal(false), fixture: z.literal(false),
  reviewFlags: z.array(z.string()),
});
const payloadSchema = z.object({
  schemaVersion: z.literal('strata.provider-ui.v1'), generatedAt: instant,
  providers: z.array(providerSchema), coverage: z.array(coverageSchema),
  events: z.array(eventSchema), news: z.array(newsSchema), barSnapshots: z.array(historicalBarSchema),
  positionReceipt: positionSchema, delayedQuote: delayedQuoteSchema, issuerResearch: z.array(issuerSchema),
  sourceOptions: z.array(z.object({ id: z.string(), label: z.string(), kind: z.string(), status: z.string() })),
  limitations: z.array(z.string()),
});

/** Exported validator is also the import/replay trust boundary. It never repairs provider claims. */
export const validateProviderResearch = (input: unknown) => payloadSchema.safeParse(input);
const checked = validateProviderResearch(payload);
if (!checked.success) throw new Error('Invalid Round 1 provider research: ' + checked.error.issues.map(x => x.path.join('.') + ': ' + x.message).join('; '));
const data = deepFreeze(checked.data);

export type ProviderRecord = z.infer<typeof providerSchema>;
export type CoverageRecord = z.infer<typeof coverageSchema>;
export type ResearchEvent = z.infer<typeof eventSchema>;
export type ResearchNews = z.infer<typeof newsSchema>;
/** Not BarSeries: no invented start/end/closed values are permitted. */
export type HistoricalBarSnapshot = z.infer<typeof historicalBarSchema>;
export type SourceOption = z.infer<typeof payloadSchema>['sourceOptions'][number];
export const PROVIDER_REGISTRY = data.providers;
export const SOURCE_COVERAGE = data.coverage;
export const SOURCE_OPTIONS = data.sourceOptions;
export const RESEARCH_EVENTS = data.events;
export const RESEARCH_NEWS = data.news;
export const ISSUER_RESEARCH = data.issuerResearch;
export const SILVER_BAR_SNAPSHOTS = data.barSnapshots;
export const CMC_POSITION_RECEIPT = data.positionReceipt;
export const CMC_DELAYED_QUOTE = data.delayedQuote;
export const PROVIDER_LIMITATIONS = data.limitations;
export const PROVIDER_RESEARCH_AS_OF = data.generatedAt;

export const getProvider = (id: string) => PROVIDER_REGISTRY.find(provider => provider.id === id);
export const getResearchEvents = (source = 'all') => RESEARCH_EVENTS.filter(event => source === 'all' || event.providerId === source);
export const getResearchNews = (source = 'all') => RESEARCH_NEWS.filter(item => source === 'all' || item.providerId === source);
export const getIssuerResearch = (portfolioLabel: string) => ISSUER_RESEARCH.filter(item => item.portfolioLabel === portfolioLabel);
export const getResearchBars = (intervalMinutes: number, source = 'cmc'): HistoricalBarSnapshot | null =>
  source !== 'cmc' && source !== 'all' ? null : SILVER_BAR_SNAPSHOTS.find(item => item.intervalMinutes === intervalMinutes) ?? null;

/** Existing runtime integrations are not replaced by these research adapters. No network side effects. */
export interface MarketDataReadAdapter {
  providerId: string;
  readBars(instrumentId: string, intervalMinutes: number): Promise<ServiceResult<BarSeries>>;
}
export interface EventResearchReadAdapter {
  providerId: string;
  readSnapshot(): readonly ResearchEvent[];
}
/** Incomplete mapping, boundary and closure semantics cannot be promoted into operational BarSeries. */
export function getOperationalBars(): ServiceResult<BarSeries> {
  return {
    state: 'unavailable', data: null, receivedAt: null, lastGood: null, receipt: null,
    error: 'No verified hosted bar adapter. The historical Silver research receipt has unresolved units, timestamp boundaries and closed state; it cannot qualify for readiness.',
  };
}
export const marketDataResearchAdapter: MarketDataReadAdapter = {
  providerId: 'cmc',
  readBars: async (instrumentId) => {assertMarketSource('cmc',instrumentId);return getOperationalBars();},
};
export const eventResearchAdapter: EventResearchReadAdapter = {
  providerId: 'bigdata',
  readSnapshot: () => RESEARCH_EVENTS,
};

export function observationAge(observedAt: string | null, now: string): { ageMs: number | null; state: 'known' | 'unknown' | 'future' } {
  const observed = instantMs(observedAt), clock = instantMs(now);
  if (observed === null || clock === null) return { ageMs: null, state: 'unknown' };
  const ageMs = clock - observed;
  return { ageMs, state: ageMs < 0 ? 'future' : 'known' };
}


