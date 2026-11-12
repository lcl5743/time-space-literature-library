"""Fill only empty abstracts using DOI+exact title (or unique official title) within the same journal.
No credentials, no PDFs, no citation refresh. Cached source pages and field-level evidence retained.
"""
import argparse, collections, datetime, hashlib, importlib.util, json, re, time
from pathlib import Path
from urllib.parse import urlencode
spec=importlib.util.spec_from_file_location('journal_collection',Path(__file__).with_name('collect-journals.py'));M=importlib.util.module_from_spec(spec);spec.loader.exec_module(M)
def norm(s):return re.sub(r'[^a-z0-9]','',M.plain(s).lower())
def reconstruct(index):
    if not index:return ''
    slots={position:word for word,positions in index.items() for position in positions}
    return ' '.join(slots[i] for i in sorted(slots))
def enrich(j):
    file=M.OUT/(j['id']+'.json')
    if not file.exists():return
    data=json.loads(file.read_text());papers=data['papers']
    if not papers or not any(not p['abstract'] for p in papers):return
    cache=M.CACHE/j['id']/'openalex';cache.mkdir(exist_ok=True)
    sourcefile=cache/'source.json'
    source=json.loads(sourcefile.read_text()) if sourcefile.exists() else M.fetch('https://api.openalex.org/sources/issn:'+j['issn'])
    M.save(sourcefile,source)
    if j['issn'] not in (source.get('issn') or []) and j['issn']!=source.get('issn_l'):raise RuntimeError('OpenAlex source ISSN mismatch')
    doi_index={p['doi']:p for p in papers if p['doi']};title_groups=collections.defaultdict(list)
    for p in papers:title_groups[norm(p['title'])].append(p)
    windows=[(datetime.date(y,1,1),min(datetime.date(y,12,31),datetime.date.fromisoformat(M.SCOPE['cutoff']))) for y in range(2010,2027)];page=0;updated=0;receipts=[]
    while windows:
        start,end=windows.pop(0)
        params={'filter':f'primary_location.source.id:{source["id"].rsplit("/",1)[-1]},from_publication_date:{start.isoformat()},to_publication_date:{end.isoformat()}','per-page':200,'select':'id,doi,title,abstract_inverted_index,publication_year'}
        url='https://api.openalex.org/works?'+urlencode(params);p=cache/('window-'+start.isoformat()+'-'+end.isoformat()+'.json')
        cached=json.loads(p.read_text()) if p.exists() else None
        response=cached['response'] if cached and cached['url']==url else M.fetch(url)
        M.save(p,{'url':url,'response':response});results=response.get('results',[])
        if response.get('meta',{}).get('count',0)>200 and start<end:
            middle=start+(end-start)//2;windows[0:0]=[(start,middle),(middle+datetime.timedelta(days=1),end)];continue
        if response.get('meta',{}).get('count',0)>200:raise RuntimeError('Single-day result exceeds public first-page limit')
        receipts.append({'page':page,'url':url,'records':len(results),'total_results':response.get('meta',{}).get('count'),'response_sha256':hashlib.sha256(json.dumps(response,sort_keys=True).encode()).hexdigest()})
        for item in results:
            doi=(item.get('doi') or '').replace('https://doi.org/','').lower();target=doi_index.get(doi)
            if not target and j['id'] in ['jmlr','tmlr']:
                candidates=title_groups[norm(item.get('title',''))]
                if len(candidates)==1 and abs((candidates[0]['year'] or 0)-(item.get('publication_year') or 0))<=1:target=candidates[0]
            if not target or target['abstract'] or norm(target['title'])!=norm(item.get('title','')):continue
            text=reconstruct(item.get('abstract_inverted_index'))
            if not text:continue
            target['abstract']=text;target['abstract_gist']=' '.join(re.split(r'(?<=[.!?])\s+',text)[:2]);target['topics']=M.classify(target['title'],text)
            target['abstract_source']='OpenAlex inverted-index abstract';target['abstract_evidence_url']=item['id'];target['abstract_retrieved_at']=M.SCOPE['cutoff'];target['abstract_match_method']='DOI + exact normalized title' if doi and doi in doi_index else 'Unique exact normalized official title + journal ISSN + year'
            updated+=1
        page+=1
        if page>300:raise RuntimeError('OpenAlex page safety limit')
        time.sleep(.15)
    data['coverage']['abstract_enrichment']={'source':'OpenAlex','source_id':source['id'],'abstracts_added':updated,'match_policy':'Empty fields only; DOI+exact normalized title, or unique official title+same journal+year for DOI-less publisher records','requests':receipts,'retrieved_at':M.SCOPE['cutoff']}
    data['coverage']['abstracts']=sum(bool(p['abstract']) for p in papers);M.save(file,data)
    print(f'{j["id"]}: +{updated} abstracts; {data["coverage"]["abstracts"]}/{len(papers)} now available',flush=True)
if __name__=='__main__':
    parser=argparse.ArgumentParser();parser.add_argument('--ids');args=parser.parse_args();selected=set(args.ids.split(',')) if args.ids else None
    errors=[]
    for journal in M.SCOPE['journals']:
        if selected and journal['id'] not in selected:continue
        try:enrich(journal)
        except Exception as error:errors.append({'id':journal['id'],'error':str(error)});print(journal['id']+': enrichment unavailable: '+str(error),flush=True)
    M.save(M.OUT/'abstract-enrichment-errors.json',errors)
