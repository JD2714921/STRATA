#!/usr/bin/env python3
"""Owner-operated, source-versioned JSON batch ingestion; no external verification."""
import sys,json,hashlib,re,pathlib,datetime,collections
ROOT=pathlib.Path(__file__).resolve().parents[1]; OUT=ROOT/'data/corpus'; OUT.mkdir(exist_ok=True);(OUT/'sources').mkdir(exist_ok=True)
REQUIRED_KEYS={'date_time_utc','location_name','latitude','longitude','title','description','instruments','middle_circle','outer_circle','elasticity_value','relevance_score','sources','notes'}
OPTIONAL_KEYS={'elasticity_method','region_tag'}
def digest(b):return hashlib.sha256(b).hexdigest()
def normalize_typographic_quotes(text):
 out=[];depth=0
 for char in text:
  if char=='“':
   out.append('\\"' if depth else '"');depth+=1
  elif char=='”':
   if depth>1:out.append('\\"');depth-=1
   elif depth==1:out.append('"');depth=0
   else:out.append('"')
  else:out.append(char)
 return ''.join(out)
def parse_batch(rawbytes):
 text=rawbytes.decode('utf-8');repairs=[]
 try:return json.loads(text),repairs
 except json.JSONDecodeError:
  fixed=text;smart_count=fixed.count('“')+fixed.count('”')
  if smart_count:
   fixed=normalize_typographic_quotes(fixed)
   repairs.append('Converted typographic quotation marks to JSON delimiters while parsing; original source bytes retained unchanged')
  fixed,count=re.subn(r'(?m)^(\s*)longitude(\s*:)',r'\1"longitude"\2',fixed)
  if count>1:raise ValueError('Multiple bare longitude keys require explicit review')
  if count:repairs.append('Quoted one bare longitude property key while parsing; original source bytes retained unchanged')
  if not repairs:raise
  return json.loads(fixed),repairs
def validate(r,year=None):
 if not isinstance(r,dict):raise ValueError('Record must be an object')
 keys=set(r);missing=REQUIRED_KEYS-keys;unexpected=keys-(REQUIRED_KEYS|OPTIONAL_KEYS)
 if missing or unexpected:raise ValueError('Unexpected or missing fields: '+str(missing|unexpected))
 for k in ['date_time_utc','location_name','title','description','middle_circle','outer_circle']:
  if not isinstance(r[k],str) or not r[k].strip():raise ValueError('Invalid text: '+k)
 if r['notes'] is not None and not isinstance(r['notes'],str):raise ValueError('Invalid text: notes')
 for k in OPTIONAL_KEYS:
  if k in r and (not isinstance(r[k],str) or not r[k].strip()):raise ValueError('Invalid optional text: '+k)
 if not re.fullmatch(r'\d{4}-\d\d-\d\dT\d\d:\d\d:\d\dZ',r['date_time_utc']):raise ValueError('Timestamp must be UTC ISO seconds')
 normalized_timestamp=r['date_time_utc'];date_issue=None
 if re.fullmatch(r'\d{4}-\d\d-00T\d\d:\d\d:\d\dZ',normalized_timestamp):
  normalized_timestamp=normalized_timestamp[:8]+'01'+normalized_timestamp[10:]
  date_issue='Supplied timestamp uses day 00; normalised to day 01 solely for chronological display while the original value remains preserved'
 dt=datetime.datetime.fromisoformat(normalized_timestamp.replace('Z','+00:00'))
 if year is not None and dt.year!=year:raise ValueError('Timestamp year does not match batch year')
 for k,low,high in [('latitude',-90,90),('longitude',-180,180),('relevance_score',0,10)]:
  if type(r[k]) not in [int,float] or not low<=r[k]<=high:raise ValueError('Invalid range: '+k)
 if r['elasticity_value'] is not None and (type(r['elasticity_value']) not in [int,float] or not float('-inf')<r['elasticity_value']<float('inf')):raise ValueError('Invalid elasticity')
 for k in ['instruments','sources']:
  if not isinstance(r[k],list) or not r[k] or any(not isinstance(v,str) or not v.strip() for v in r[k]):raise ValueError('Invalid list: '+k)
 return normalized_timestamp,date_issue,dt.year
# Exact/context-safe index aliases only; no inversions, yield/price or cash/futures substitution.
ALIASES={'SPX':'SPX','DJIA':'DOW','FTSE 100':'UK100','GBPUSD':'GBPUSD','HSI':'HANGSENG','Nikkei 225':'NK225','Nikkei':'NK225','DAX':'DAX','VIX':'VIX','USD index':'DXY','USDJPY':'USDJPY'}
def geography(r):
 s=r['location_name'];mapping=[('United States','United States'),('United Kingdom','United Kingdom'),('Hong Kong','China'),('China','China'),('Japan','Japan'),('Germany','Europe'),('Eurozone','Europe'),('Austria','Europe'),('Iraq','Middle East')]
 if s.startswith(('Global','OPEC')):return 'Global','Global / multi-region'
 for name,region in mapping:
  if name in s:return region,name
 return 'Emerging Markets',s.split(',')[-1].strip()
def category(title):
 t=title.lower()
 for kind,pattern in [('Monetary Policy',r'fed|fomc|interest rate|bank of england|ecb|central bank|currency band|floats|peg|devalu'),('Corporate',r'merger|acquisition|acquires|ipo|boeing|microsoft|compaq|citicorp|chrysler'),('Conflict',r'airstrike|nuclear|war|attack'),('Elections',r'election|resign|president|impeach|handover|death'),('Commodity',r'opec|oil|production cut'),('Liquidity',r'liquidity|ltcm|bailout|rescue|default|crisis|capital control'),('Market Structure',r'dow|nasdaq|equities|market|index')]:
  if re.search(pattern,t):return kind
 return 'Other'
existing=json.loads((OUT/'records.json').read_text()) if (OUT/'records.json').exists() else []
by_id={r['id']:r for r in existing};added=duplicates=0;batch_reports=[];timestamp=datetime.datetime.now(datetime.timezone.utc).isoformat()
for arg in sys.argv[1:]:
 p=pathlib.Path(arg);year=int(p.stem) if re.fullmatch(r'\d{4}',p.stem) else None;rawbytes=p.read_bytes();raw,parse_repairs=parse_batch(rawbytes);assert isinstance(raw,list),'Batch must be an array';checksum=digest(rawbytes)
 source_slug=str(year) if year is not None else re.sub(r'[^a-z0-9]+','-',p.stem.lower()).strip('-')
 if not source_slug:raise ValueError('Source filename must contain letters or digits')
 target=OUT/'sources'/f'{source_slug}.txt'
 if target.exists() and digest(target.read_bytes())!=checksum:raise ValueError(f'{target.name}: source revision conflict; provide an explicit new batch/version')
 pending=[];seen=set()
 for index,r in enumerate(raw,1):
  normalized_timestamp,date_issue,record_year=validate(r,year);identity='|'.join([r['date_time_utc'],r['title'].strip().casefold(),r['location_name'].strip().casefold()]);rid='HIST_'+str(record_year)+'_'+digest(identity.encode())[:16]
  if rid in seen:raise ValueError(f'{target.name}: duplicate identity at row {index}')
  seen.add(rid);contenthash=digest(json.dumps(r,sort_keys=True,ensure_ascii=False).encode())
  if rid in by_id:
   if by_id[rid]['contentSha256']!=contenthash:raise ValueError('Record revision conflict: '+rid)
   duplicates+=1;continue
  issues=list(parse_repairs)
  if date_issue:issues.append(date_issue)
  if any(not s.startswith(('https://','http://')) for s in r['sources']):issues.append('Non-specific source description; documentary citation needed')
  if record_year<1999 and any('EUR' in i for i in r['instruments']):issues.append('Pre-1999 euro reference: verify historical or back-series interpretation')
  if 'handover' in r['title'].lower():issues.append('Verify supplied UTC timestamp against the midnight handover described in the record')
  mapped=list(dict.fromkeys(ALIASES[i] for i in r['instruments'] if i in ALIASES));unmapped=[i for i in r['instruments'] if i not in ALIASES]
  region,country=geography(r)
  pending.append({'id':rid,'batchId':f'CORPUS_{source_slug.upper().replace("-","_")}_{checksum[:12]}','sourceFile':target.name,'sourceRow':index,'sourceSha256':checksum,'contentSha256':contenthash,'ingestedAt':timestamp,'verification':'Unverified user-supplied','issues':issues,'mappedInstrumentIds':mapped,'unmappedInstrumentReferences':unmapped,'derivedRegion':region,'derivedCountry':country,'derivedCategory':category(r['title']),'classificationStatus':'Rule-derived; not verified','normalizedDateTimeUtc':normalized_timestamp,'raw':r})
 for row in pending:by_id[row['id']]=row
 added+=len(pending);target.write_bytes(rawbytes);year_counts=dict(sorted(collections.Counter(r['date_time_utc'][:4] for r in raw).items()));batch_reports.append({'sourceFile':target.name,'year':year,'years':year_counts,'records':len(raw),'sha256':checksum,'acceptedNew':len(pending),'parseRepairs':parse_repairs})
records=sorted(by_id.values(),key=lambda r:(r.get('normalizedDateTimeUtc',r['raw']['date_time_utc']),r['id']));(OUT/'records.json').write_text(json.dumps(records,ensure_ascii=False,indent=2)+'\n')
report={'totalRecords':len(records),'years':dict(sorted(collections.Counter(r['raw']['date_time_utc'][:4] for r in records).items())),'verifiedRecords':0,'missingElasticity':sum(r['raw']['elasticity_value'] is None for r in records),'recordsWithSourceDescriptions':sum(any(not s.startswith(('https://','http://')) for s in r['raw']['sources']) for r in records),'recordsFlagged':sum(bool(r['issues']) for r in records),'unmappedReferences':sorted(set(i for r in records for i in r['unmappedInstrumentReferences'])),'sourcesCheckedExternally':False,'storage':'Immutable source files and normalised records versioned with the Site source repository'}
(OUT/'report.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n');print(json.dumps({'added':added,'duplicatesSkipped':duplicates,'batches':batch_reports,'report':report},ensure_ascii=False))
