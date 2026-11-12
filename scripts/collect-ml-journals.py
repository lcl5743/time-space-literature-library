"""Publisher inventories for DOI-sparse JMLR and TMLR; OpenReview supplements accepted TMLR abstracts only."""
import collections, hashlib, importlib.util, json, re, subprocess
from pathlib import Path
from urllib.parse import urljoin, urlparse, parse_qs
spec=importlib.util.spec_from_file_location('journal_collection',Path(__file__).with_name('collect-journals.py'));M=importlib.util.module_from_spec(spec);spec.loader.exec_module(M)
def get(url):
    cache=M.CACHE/'official-ml';cache.mkdir(exist_ok=True);file=cache/(hashlib.sha256(url.encode()).hexdigest()+'.html')
    if not file.exists():
        r=subprocess.run(['curl','--fail','--silent','--show-error','--location','--retry','2','--max-time','90',url],capture_output=True,check=True);file.write_bytes(r.stdout)
    return file.read_text(errors='replace')
def paper(j,title,names,year,url,pdf,volume='',pages=''):
    row=M.normalize({'DOI':'','title':[title],'author':[{'name':x.strip()} for x in names.split(',') if x.strip()],'issued':{'date-parts':[[year]]},'volume':volume,'page':pages},j)
    row.update(id='J-'+hashlib.sha256(url.encode()).hexdigest()[:16].upper(),official_url=url,pdf_url=pdf,pdf_access_status='Official publisher PDF link; no PDF downloaded',metadata_evidence_url=url,metadata_source='Official publisher article directory',year_basis='publisher-directory',authors_raw=M.plain(names))
    return row
def save(j,rows,requests,extra=None):
    rows=list({p['official_url']:p for p in rows}.values());rows.sort(key=lambda p:(-p['year'],p['title'].lower()));counts=collections.Counter(p['year'] for p in rows)
    coverage={'journal_id':j['id'],'registry_source':j['official_url'],'registry_title':j['title'],'registry_issns':[j['issn']],'cutoff':M.SCOPE['cutoff'],'start_year':2010,'records':len(rows),'abstracts':sum(bool(p['abstract']) for p in rows),'api_status':'publisher-directory-enumerated','publisher_directory_status':'enumerated-public-directory','all_topics_included':True,'requests':requests,'years':[{'year':y,'records':counts[y],'api_status':'publisher-directory-enumerated' if counts[y] else 'no-records-in-retrieved-directory','publisher_directory_status':'enumerated-public-directory' if counts[y] else 'not-confirmed-empty'} for y in range(2010,2027)]}
    if extra:coverage.update(extra)
    M.save(M.OUT/(j['id']+'.json'),{'journal':j,'coverage':coverage,'papers':rows});print(j['id']+': '+str(len(rows))+' official publisher records',flush=True)
def jmlr():
    j=next(j for j in M.SCOPE['journals'] if j['id']=='jmlr');j['official_url']='https://jmlr.org/papers/'
    index=get(j['official_url']);links=re.findall(r'<a\b[^>]*href=[\'"]([^\'"]+)[\'"][^>]*>(?:\s*<[^>]+>)*\s*Volume\s+(\d+)',index,re.I)
    selected=[(urljoin(j['official_url'],u),int(v)) for u,v in links if int(v)>=11];rows=[];receipts=[]
    if len(selected)<10:raise RuntimeError('Publisher volume parser returned too few volumes')
    for url,volume in selected:
        body=get(url);count=0
        for block in re.findall(r'<dl\b[^>]*>(.*?)</dl>',body,re.S|re.I):
            title=re.search(r'<dt\b[^>]*>(.*?)</dt>',block,re.S|re.I);authors=re.search(r'<i>(.*?)</i>',block,re.S|re.I)
            abstract_link=re.search(r'href=[\'"]([^\'"]+)[\'"][^>]*>abs</a>',block,re.I);pdf_link=re.search(r'href=[\'"]([^\'"]+)[\'"][^>]*>pdf</a>',block,re.I)
            year=re.search(r',\s*(20\d{2})\.',M.plain(block))
            if not all([title,authors,abstract_link,year]):continue
            year=int(year[1])
            if not 2010<=year<=2026:continue
            rows.append(paper(j,M.plain(title[1]),M.plain(authors[1]),year,urljoin(url,abstract_link[1]),urljoin(url,pdf_link[1]) if pdf_link else '',str(volume)));count+=1
        receipts.append({'url':url,'volume':volume,'records':count,'response_sha256':hashlib.sha256(body.encode()).hexdigest(),'retrieved_at':M.SCOPE['cutoff']})
        print('JMLR volume '+str(volume)+': '+str(count),flush=True)
    save(j,rows,receipts,{'latest_directory_volume':max(v for _,v in selected),'limitation':'Only volumes linked by the retrieved official index are asserted enumerated. A year with no returned entries is not confirmed empty.'})
def tmlr():
    j=next(j for j in M.SCOPE['journals'] if j['id']=='tmlr');j['official_url']='https://jmlr.org/tmlr/papers/'
    body=get(j['official_url']);rows=[]
    for block in re.findall(r'<li\b[^>]*class="item\b[^>]*>(.*?)</li>',body,re.S|re.I):
        title=re.search(r'<h4[^>]*>.*?<b>(.*?)</b>',block,re.S|re.I);authors=re.search(r'<i>(.*?)</i>',block,re.S|re.I);year=re.search(r'</i>\s*,?\s*\w+\s+(20\d{2})',block,re.I)
        forum=re.search(r'href="(https://openreview.net/forum\?id=[^"]+)"',block);pdf=re.search(r'href="(https://openreview.net/pdf\?id=[^"]+)"',block)
        if not all([title,authors,year,forum]):continue
        p=paper(j,M.plain(title[1]),M.plain(authors[1]),int(year[1]),forum[1],pdf[1] if pdf else '')
        code=re.search(r'href="([^"]+)"[^>]*>code</a>',block)
        if code:p['code_url']=code[1];p['code_status']='Linked by publisher directory'
        rows.append(p)
    if len(rows)<100:raise RuntimeError('TMLR directory parser returned too few records')
    byid={parse_qs(urlparse(p['official_url']).query)['id'][0]:p for p in rows};receipts=[{'url':j['official_url'],'records':len(rows),'response_sha256':hashlib.sha256(body.encode()).hexdigest(),'retrieved_at':M.SCOPE['cutoff']}]
    for offset in range(0,20000,1000):
        url='https://api2.openreview.net/notes?content.venueid=TMLR&limit=1000&offset='+str(offset)
        cache=M.CACHE/'official-ml'/('tmlr-notes-'+str(offset)+'.json')
        try:
            response=json.loads(cache.read_text()) if cache.exists() else M.fetch(url);M.save(cache,response)
        except Exception as error:print('TMLR OpenReview supplement unavailable: '+str(error),flush=True);break
        notes=response.get('notes',[])
        receipts.append({'url':url,'records':len(notes),'count':response.get('count'),'response_sha256':hashlib.sha256(json.dumps(response,sort_keys=True).encode()).hexdigest()})
        for note in notes:
            target=byid.get(note['id'])
            if not target:continue
            content=note.get('content',{});value=lambda key:content.get(key,{}).get('value') if isinstance(content.get(key),dict) else content.get(key)
            if M.plain(value('title')).lower()!=target['title'].lower():continue
            abstract=value('abstract')
            if abstract:target['abstract']=abstract;target['abstract_gist']=' '.join(re.split(r'(?<=[.!?])\s+',abstract)[:2]);target['abstract_source']='OpenReview accepted-paper note, joined to official accepted list';target['abstract_evidence_url']=target['official_url'];target['topics']=M.classify(target['title'],abstract)
            authors=value('authors')
            if isinstance(authors,list):target['authors']=[{'name':a,'orcid':''} for a in authors]
        if len(notes)<1000:break
    save(j,rows,receipts,{'established_year':2022,'limitation':'Official accepted-paper list enumerated. OpenReview notes are accepted only when ID and title join to that list; no submissions are promoted to accepted papers.'})
if __name__=='__main__':
    import sys
    if len(sys.argv)==1 or 'jmlr' in sys.argv:jmlr()
    if len(sys.argv)==1 or 'tmlr' in sys.argv:tmlr()
