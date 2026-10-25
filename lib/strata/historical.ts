import records from '@/data/corpus/records.json';
import report from '@/data/corpus/report.json';
import type {HistoricalIngestionRecord,MarketEvent} from './types';
export const corpusRecords=records as HistoricalIngestionRecord[];
export const corpusReport=report;
export const historicalLabel=(id:string)=>id.startsWith('HIST_REF:')?id.slice(9):id;
export const historicalEvents:MarketEvent[]=corpusRecords.map(record=>{const r=record.raw;const date=record.normalizedDateTimeUtc??r.date_time_utc;const provenance={kind:'User provided' as const,source:record.sourceFile+' · record '+record.sourceRow,asOf:date,demo:false,freshness:'Historical' as const};return {id:record.id,title:r.title,date,region:record.derivedRegion,country:record.derivedCountry,lat:r.latitude,lon:r.longitude,type:record.derivedCategory,importance:r.relevance_score>=8?'High':r.relevance_score>=5?'Medium':'Low',state:'Historical',assets:[...record.mappedInstrumentIds,...record.unmappedInstrumentReferences.map(i=>'HIST_REF:'+i)],regime:'Unknown',confidence:{score:null,level:'Unknown'},provenance,summary:r.description,before:r.middle_circle,reaction:[{window:'As described in source record',instrumentId:record.mappedInstrumentIds[0]||'Unmapped',direction:'Not quantified',change:null,followThrough:r.outer_circle,provenance}],notes:r.notes??'',session:'Unknown',historical:record}});
