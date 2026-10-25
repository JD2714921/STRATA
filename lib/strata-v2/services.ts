import type {BarSeries,BrokerInstrument,DecisionSnapshot,OwnerDecision,PositionSnapshot,RefreshReceipt,ServiceResult,StrataAssessment} from './contracts';
import type {EventExpectation,ObservedResponse} from './research';
import type {Interpretation} from './interpretation';
import type {OwnerConfig,ReadinessInput} from './rules';
/** Implementations receive authenticated request context from the server, never browser asserted ownership. */
export interface RequestScope {ownerId:string;requestId:string;asOf:string;accountId:string|null}
export interface MarketDataService {bars(scope:RequestScope,instrument:BrokerInstrument,intervalMinutes:number):Promise<ServiceResult<BarSeries>>}
export interface EventEvidence {id:string;title:string;eventFamily:string;instrumentIds:string[];scheduledAt:string|null;publishedAt:string|null;firstSeenAt:string;updatedAt:string|null;sourceIds:string[];syndicationGroupId:string|null;kind:'calendar'|'headline'|'filing'|'macro-release';expectationKind:EventExpectation['kind']|null;consensus:number|null;actual:number|null;referencePeriod:string|null;revisionOf:string|null;horizon:'intraday'|'portfolio'|'macro'}
export interface EventService {events(scope:RequestScope,instrumentIds:string[]):Promise<ServiceResult<EventEvidence[]>>}
export interface AccountService {positions(scope:RequestScope,instrument:BrokerInstrument):Promise<ServiceResult<PositionSnapshot>>}
export interface PortfolioHolding {id:string;displayedLabel:string;brokerInstrumentId:string|null;quantity:number|null;value:number|null;currency:string|null;observedAllocationPct:number|null;intendedTargetWeightPct:number|null;brokerAllocationPct:number|null;captureTime:string|null;sourceIds:string[];reconciledAt:string|null}
export interface PortfolioService {holdings(scope:RequestScope):Promise<ServiceResult<PortfolioHolding[]>>}
export interface ResearchService {expectations(scope:RequestScope,instrumentId:string):Promise<ServiceResult<EventExpectation[]>>;responses(scope:RequestScope,expectationId:string):Promise<ServiceResult<ObservedResponse[]>>}
export interface RulesService {config(scope:RequestScope):Promise<OwnerConfig>;evaluate(input:ReadinessInput):StrataAssessment}
export interface InterpretationService {explain(scope:RequestScope,assessment:StrataAssessment):Promise<ServiceResult<Interpretation>>}
export interface AuditService {appendEvaluation(scope:RequestScope,snapshot:DecisionSnapshot):Promise<void>;appendDecision(scope:RequestScope,decision:OwnerDecision):Promise<void>;appendRefresh(scope:RequestScope,receipt:RefreshReceipt):Promise<void>;readSnapshot(scope:RequestScope,id:string):Promise<DecisionSnapshot|null>}
export interface ProviderAdapterBoundary {providerId:'cmc'|'trading212'|'financial-datasets'|'bigdata'|'newsify'|'official'|string;path:'chat'|'hosted-request'|'unattended';structured:boolean;accountScope:string|null;declaredDelayMs:number|null;entitlement:'verified'|'blocked'|'unknown';hostedEligibility:'verified'|'unsupported'|'unknown';visitorConsent:'granted'|'missing'|'unknown';refresh:'manual'|'request-scoped'|'disabled';lastReceipt:RefreshReceipt|null}
