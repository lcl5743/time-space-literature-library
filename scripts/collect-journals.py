"""Resumable publisher-deposited Crossref inventory. No PDF downloads or invented fields.
Raw responses stay in ignored cache/; processed metadata and request receipts are committed.
Usage: python3 scripts/collect-journals.py [--ids aos,jasa] [--refresh]
"""
import argparse, collections, datetime, hashlib, html, json, re, subprocess, time
from pathlib import Path
from urllib.parse import urlencode, quote
ROOT=Path(__file__).resolve().parents[1]
SCOPE=json.loads((ROOT/'data/journal-scope.json').read_text())
OUT=ROOT/'data/journals'; CACHE=ROOT/'cache/journals'
OUT.mkdir(exist_ok=True);CACHE.mkdir(parents=True,exist_ok=True)
SELECT='DOI,title,author,container-title,ISSN,issued,published-online,published-print,volume,issue,page,abstract,URL,link,type,is-referenced-by-count,relation'
def save(path,value):
    tmp=path.with_suffix('.tmp');tmp.write_text(json.dumps(value,ensure_ascii=False,separators=(',',':'))+'\n');tmp.replace(path)
def plain(value):
    value=re.sub(r'</?(?:jats:)?(?:title|p|sec|abstract)[^>]*>',' ',str(value or ''),flags=re.I)
    return re.sub(r'\s+',' ',html.unescape(re.sub(r'<[^>]+>','',value))).strip()
def fetch(url):
    for attempt in range(4):
        run=subprocess.run(['curl','--silent','--show-error','--max-time','90','--user-agent','TimeSpaceLiterature/1.0 (bibliographic inventory; https://github.com/lcl5743/time-space-literature-site)','--write-out','\n%{http_code}',url],capture_output=True)
        body,_,code=run.stdout.rpartition(b'\n')
        if not run.returncode and code==b'200':return json.loads(body)
        if code in [b'401',b'403',b'404'] or attempt==3:raise RuntimeError(f'HTTP {code.decode(errors="replace")} curl={run.returncode}')
        time.sleep(2**attempt*2)
def dates(item,key):return item.get(key,{}).get('date-parts',[[]])[0]
def classify(title,abstract):
    text=(title+' '+abstract).lower();tags=[]
    patterns={
      'time-series':r'\btime[ -]?series\b|\bautoregress|\bforecast|\bserial depend|\blong[- ]memory\b|\bchange[- ]point\b|\bgranger\b',
      'spatio-temporal':r'\bspatio[ -]?temporal\b|\bspatial[ -]?temporal\b|\bspace[ -]?time\b',
      'spatial':r'\bspatial\b|\bgeostatistic|\bgeospatial',
      'causal':r'\bcausal\b|\bcounterfactual|\bpotential outcomes\b|\bconfound|\binstrumental variable|\btreatment effect|\bintervention',
      'bayesian':r'\bbayes|\bposterior\b|\bprior distribution',
      'high-dimensional':r'\bhigh[- ]dimensional\b|\bsparsity\b|\bsparse\b|\bvariable selection\b',
      'inference':r'\binference\b|\bhypothesis test|\bconfidence|\bestimat',
      'nonparametric':r'\bnonparametric|\bsemiparametric',
      'probability':r'\bcentral limit\b|\bconvergence\b|\bstochastic process|\bmarkov\b|\bprobability\b',
      'survival-longitudinal':r'\bsurvival\b|\blongitudinal\b|\bcensor|\bhazard\b',
      'computation':r'\bmonte carlo\b|\bmcmc\b|\bvariational\b|\bsampling algorithm',
      'statistical-learning':r'\bmachine learning\b|\bdeep learning\b|\bneural network|\brandom forest|\bclassification\b',
      'experimental-design':r'\bexperimental design|\brandomi[sz]ed|\bdesign of experiment|\bsurvey sampl'
    }
    for tag,pattern in patterns.items():
        if re.search(pattern,text):tags.append(tag)
    return tags or ['other-statistics']
def normalize(x,journal):
    doi=x.get('DOI','').lower().strip();title=plain((x.get('title') or [''])[0]);abstract=plain(x.get('abstract'))
    date_map={k:dates(x,k) for k in ['issued','published-online','published-print']}
    eligible=[(k,v) for k,v in date_map.items() if v and SCOPE['start_year']<=v[0]<=int(SCOPE['cutoff'][:4])]
    chosen=next(((k,v) for k,v in eligible if k=='published-print'),None) or next(((k,v) for k,v in eligible if k=='published-online'),None) or (eligible[0] if eligible else ('issued',dates(x,'issued')))
    year=chosen[1][0] if chosen[1] else None
    kind='research-or-unspecified'
    for label,pattern in [('correction',r'errat|corrigend|correction|retract'),('discussion',r'^discussion|^comment|^rejoinder|^reply|author.?s.? response'),('editorial',r'editorial|editor.?s note|acknowledg|referees|reviewers|obituary|in memoriam'),('book-review',r'^book review')]:
        if re.search(pattern,title,re.I):kind=label;break
    links=x.get('link') or [];pdf=next((r.get('URL','') for r in links if r.get('content-type')=='application/pdf'),'')
    authors=[{'name':a.get('name') or ' '.join(filter(None,[a.get('given'),a.get('family')])),'orcid':a.get('ORCID','')} for a in x.get('author',[])]
    return {'id':'J-'+hashlib.sha256(doi.encode()).hexdigest()[:16].upper(),'doi':doi,'title':title,'authors':authors,'journal_id':journal['id'],'journal':journal['title'],'deposited_journal_titles':x.get('container-title',[]),'issn':x.get('ISSN',[]),'year':year,'year_basis':chosen[0],'dates':date_map,'volume':x.get('volume',''),'issue':x.get('issue',''),'pages':x.get('page',''),'abstract':abstract,'abstract_original_markup':x.get('abstract',''),'abstract_gist':(' '.join(re.split(r'(?<=[.!?])\s+',abstract)[:2])),'ai_summary':'','topics':classify(title,abstract),'classification_basis':'Automatic title/abstract keyword signals; not a full-text or causal-validity judgment','article_kind':kind,'official_url':x.get('URL') or 'https://doi.org/'+doi,'pdf_url':pdf,'pdf_access_status':'Publisher metadata link; access not tested' if pdf else 'Not found','code_url':'','code_status':'Not searched','reading_status':'Not started','download_status':'Not started','citation_count':None,'crossref_cited_by_count':x.get('is-referenced-by-count'),'relations':x.get('relation',{}),'metadata_source':'Crossref publisher deposit','metadata_evidence_url':'https://api.crossref.org/works/'+quote(doi,safe=''),'retrieved_at':datetime.date.today().isoformat()}
def collect(journal,refresh=False):
    jd=CACHE/journal['id'];jd.mkdir(exist_ok=True)
    registry=fetch('https://api.crossref.org/journals/'+journal['issn'])['message']
    # Verify identity from the ISSN registry before accepting a corpus under a journal name.
    wanted=set(re.findall(r'[a-z]+',journal['title'].lower()))-{'the','of','and','a','b','c','series'}
    got=set(re.findall(r'[a-z]+',registry['title'].lower()))
    if len(wanted&got)/max(1,len(wanted))<.8:raise RuntimeError('ISSN/title identity mismatch: '+registry['title'])
    cursor='*';page=0;items={};receipts=[];expected=None;complete=False
    while True:
        params={'filter':f'from-pub-date:{SCOPE["start_year"]}-01-01,until-pub-date:{SCOPE["cutoff"]},type:journal-article','rows':1000,'cursor':cursor,'select':SELECT}
        url='https://api.crossref.org/journals/'+journal['issn']+'/works?'+urlencode(params)
        cache=jd/f'page-{page:04d}.json'
        if cache.exists() and not refresh:
            cached=json.loads(cache.read_text())
            message=cached['message'] if cached['url']==url else fetch(url)['message']
        else:message=fetch(url)['message']
        save(cache,{'url':url,'message':message})
        if expected is None:expected=message['total-results']
        batch=message['items']
        receipts.append({'page':page,'url':url,'items':len(batch),'total_results':message['total-results'],'response_sha256':hashlib.sha256(json.dumps(message,sort_keys=True).encode()).hexdigest(),'retrieved_at':datetime.datetime.now(datetime.timezone.utc).isoformat()})
        for x in batch:
            if x.get('DOI'):items[x['DOI'].lower()]=normalize(x,journal)
        if len(batch)<1000:complete=True;break
        new_cursor=message.get('next-cursor')
        if not new_cursor:break
        cursor=new_cursor;page+=1
        if page>1000:raise RuntimeError('Pagination safety limit reached')
        time.sleep(.4)
    rows=sorted(items.values(),key=lambda x:(-(x['year'] or 0),x['title'].lower()))
    counts=collections.Counter(str(x['year']) for x in rows)
    # API enumeration is not publisher-issue reconciliation or proof of exhaustive publication coverage.
    status='crossref-enumerated' if complete and len(rows)==expected else 'crossref-incomplete'
    evidence={'journal_id':journal['id'],'issn_query':journal['issn'],'registry_title':registry['title'],'registry_issns':registry.get('ISSN',[]),'registry_source':'https://api.crossref.org/journals/'+journal['issn'],'cutoff':SCOPE['cutoff'],'start_year':SCOPE['start_year'],'expected_crossref_records':expected,'records':len(rows),'abstracts':sum(bool(x['abstract']) for x in rows),'api_status':status,'publisher_directory_status':'not-reconciled','all_topics_included':True,'requests':receipts,'years':[{'year':y,'records':counts[str(y)],'api_status':status,'publisher_directory_status':'not-reconciled'} for y in range(SCOPE['start_year'],int(SCOPE['cutoff'][:4])+1)]}
    save(OUT/(journal['id']+'.json'),{'journal':journal,'coverage':evidence,'papers':rows})
    print(f'{journal["id"]}: {len(rows)}/{expected} Crossref records; {evidence["abstracts"]} abstracts; {status}',flush=True)
    return evidence
if __name__=='__main__':
    parser=argparse.ArgumentParser();parser.add_argument('--ids');parser.add_argument('--refresh',action='store_true');args=parser.parse_args()
    selected=set(args.ids.split(',')) if args.ids else None
    failures=[]
    for j in SCOPE['journals']:
        if selected and j['id'] not in selected:continue
        try:collect(j,args.refresh)
        except Exception as error:failures.append({'id':j['id'],'error':str(error)});print(j['id']+': FAILED '+str(error),flush=True)
    save(OUT/'collection-errors.json',failures)
    if failures:raise SystemExit(1)
