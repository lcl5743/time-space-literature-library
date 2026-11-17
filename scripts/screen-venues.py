"""Title screen of AISTATS, UAI and TMLR against their complete official paper lists.
Applies the title pattern of the original 15-venue screen, adds missing matches with official metadata,
and records one coverage row per venue-year. Raw responses stay in ignored cache/venues.
Usage: python3 scripts/screen-venues.py [--write]   (dry run without --write)
"""
import argparse, collections, datetime, difflib, hashlib, html, json, re, subprocess, time
import xml.etree.ElementTree as ET
from pathlib import Path
from urllib.parse import quote
ROOT=Path(__file__).resolve().parents[1]
CACHE=ROOT/'cache/venues';CACHE.mkdir(parents=True,exist_ok=True)
TODAY=datetime.date.today().isoformat()
UA='time-space-literature-library venue screen (https://github.com/lcl5743/time-space-literature-library)'
# Same title pattern as the original 2010-2026 conference screen.
PAT=re.compile(r'time.?series|spatio.?temporal|spatial.?temporal|forecast|nowcast|trajector|traffic|weather|climate|precipitation|temporal causal|remote.?sensing|geospatial|spatial crowdsourc|urban comput|next.?poi|point.of.interest|travel.time|time.?varying|temporal point process|irregular.*(?:sampl|time)|functional.*time|sensor.*(?:data|network)|multivariate.*(?:temporal|sequence)|imputation|change.point|temporal anomaly',re.I)
# Scope rule of the thematic collection (title, abstract and keywords).
SCOPE=r'time[ -]?series|spatio[ -]?temporal|spatial[ -]?temporal|forecast|imput|trajector|traffic|weather|climate|remote.sensing|temporal causal|时空|时间序列|时序|轨迹|天气|交通|气候|遥感'
# Official UAI pages for years before UAI moved to PMLR (2010 and 2012 have no list online).
UAI_PAGES={2011:'https://www.auai.org/uai2011/accepted.html',2013:'https://www.auai.org/uai2013/acceptedPapers.shtml',2014:'https://www.auai.org/uai2014/acceptedPapers.shtml',2015:'https://www.auai.org/uai2015/acceptedPapers.shtml',2016:'https://www.auai.org/uai2016/proceedings.php',2017:'https://www.auai.org/uai2017/accepted.php',2018:'https://www.auai.org/uai2018/accepted.php'}

def fetch(url,pause=1.0):
    path=CACHE/(hashlib.sha1(url.encode()).hexdigest()[:20]+'.txt')
    if path.exists():return path.read_text(encoding='utf-8')
    for attempt in range(4):
        run=subprocess.run(['curl','--silent','--show-error','--location','--max-time','90','--user-agent',UA,'--write-out','\n%{http_code}',url],capture_output=True)
        body,_,code=run.stdout.rpartition(b'\n')
        if not run.returncode and code==b'200':
            text=body.decode('utf-8','replace');path.write_text(text,encoding='utf-8');time.sleep(pause);return text
        if code==b'404':return ''
        if attempt==3:raise RuntimeError(f'HTTP {code.decode(errors="replace")} for {url}')
        time.sleep(5*2**attempt)
clean=lambda s:re.sub(r'\s+',' ',html.unescape(re.sub(r'<[^>]+>',' ',s or ''))).strip()
def norm(t):
    t=re.sub(r'^\[(?:Oral|Poster|Spotlight|Short(?: Paper)?)\]\s*','',t or '',flags=re.I)
    t=re.sub(r'\s*[（(](?:Oral|Poster|Spotlight)[）)]\s*$','',t,flags=re.I)
    return re.sub(r'[^a-z0-9]','',t.lower())
pid=lambda t:'P-'+hashlib.sha256(norm(t).encode()).hexdigest()[:12].upper()
def classify(text):
    t=(text or '').lower()
    groups={
    'tasks':[('预测',r'forecast|prediction|预测'),('分类',r'classification|分类'),('异常检测',r'anomal|异常'),('填补与恢复',r'imput|填补|插补|补全|recovery|恢复'),('表示学习',r'representation|embedding|表示学习|表征'),('生成与模拟',r'generation|generative|simulation|生成|模拟'),('因果发现与推断',r'causal|causality|因果'),('推荐',r'recommend|推荐|poi'),('压缩与存储',r'compress|storage|database|压缩|数据库|存储'),('聚类与模式发现',r'cluster|motif|聚类|基序'),('不确定性量化',r'uncertainty|conformal|calibration|不确定|保形|校准'),('优化与控制',r'control|reinforcement|控制|强化学习|optimization|优化')],
    'methods':[('Transformer',r'transformer'),('LLM',r'\bllm\b|large language|大语言|大模型'),('基础模型',r'foundation model|基础模型'),('扩散模型',r'diffusion|扩散'),('图学习',r'\bgnn\b|graph neural|graph convolution|图神经|图卷积'),('Mamba/状态空间模型',r'mamba|state.space|状态空间'),('MLP/Mixer',r'\bmlp\b|mixer'),('贝叶斯方法',r'bayesian|贝叶斯'),('对比学习',r'contrastive|对比学习'),('自监督/预训练',r'self.supervised|pre.train|自监督|预训练'),('强化学习',r'reinforcement|强化学习'),('因果方法',r'causal|因果')],
    'domains':[('交通与移动',r'traffic|transport|mobility|trajectory|交通|轨迹|移动性'),('天气与气候',r'weather|climate|气象|天气|气候'),('医疗与生理信号',r'health|medical|ecg|eeg|epidem|医疗|生理|心电|脑电|疫情'),('能源与电力',r'energy|electric|power grid|能源|电力'),('金融与经济',r'financ|economic|金融|经济'),('城市科学',r'urban|city|城市'),('遥感与地球科学',r'remote sensing|satellite|earth|遥感|卫星'),('视频与动作',r'video|action recognition|motion|视频|动作'),('工业与运维',r'industrial|sensor|iot|root.cause|工业|运维|传感器')],
    'data_types':[('多变量时序',r'multivariat|多变量|多元'),('不规则时序',r'irregular|不规则'),('层次时序',r'hierarch|层次'),('时空图',r'spatio.temporal graph|spatial.temporal graph|时空图'),('轨迹',r'trajectory|trajectories|轨迹'),('栅格与空间场',r'gridded|spatial field|栅格|空间场'),('视频',r'video|视频'),('多模态',r'multi.modal|multimodal|多模态')]}
    return {k:'; '.join(label for label,pat in a if re.search(pat,t)) for k,a in groups.items()}
def gist(text):
    if not text:return ''
    s=re.split(r'(?<=[.!?])\s+',text);c=next((x for x in s[1:] if re.search(r'we (?:propose|present|introduce|develop)|this paper (?:proposes|presents|introduces)',x,re.I)),None)
    return ' '.join([s[0]]+([c] if c else s[1:2]))[:900]

def pmlr_volumes():
    index=fetch('https://proceedings.mlr.press/')
    out=collections.defaultdict(dict)
    for vol,label in re.findall(r'<a href="(v\d+)/?">\s*<b>Volume \d+</b>\s*</a>\s*(.*?)</li>',index,re.S):
        m=re.fullmatch(r'(?:Proceedings of )?(AISTATS|UAI) (\d{4})(?: Proceedings)?',clean(label))
        if m and int(m.group(2))>=2010:out[m.group(1)][int(m.group(2))]=f'https://proceedings.mlr.press/{vol}/'
    return out
def pmlr_list(url):
    page=fetch(url,pause=2)
    rows=[]
    for title,authors,links in re.findall(r'<div class="paper">\s*<p class="title">(.*?)</p>\s*<p class="details">\s*<span class="authors">(.*?)</span>.*?<p class="links">(.*?)</p>',page,re.S):
        abs_url=re.search(r'href="([^"]+\.html)"',links);pdf=re.search(r'href="([^"]+\.pdf)"',links)
        rows.append({'title':clean(title),'authors':'; '.join(a.strip() for a in clean(authors).split(',') if a.strip()),'url':abs_url.group(1) if abs_url else '','pdf':pdf.group(1) if pdf else ''})
    return rows
def pmlr_abstract(url):
    page=fetch(url,pause=0.6)
    m=re.search(r'<div id="abstract" class="abstract">(.*?)</div>',page,re.S)
    return clean(m.group(1)) if m else ''
def uai_list(year,url):
    page=fetch(url,pause=1.5);rows=[]
    absolute=lambda u:u.replace('http://auai.org/','https://www.auai.org/') if u.startswith('http') else url.rsplit('/',1)[0]+'/'+u
    split_authors=lambda s:'; '.join(a.split(',')[0].strip() for a in re.split(r';',s) if a.strip())
    if year in(2017,2018):
        for chunk in page.split("<tr><td width='15%'>")[1:]:
            t=re.search(r'<h4>(.*?)</h4>(.*?)<button',chunk,re.S);pdf=re.search(r"href='([^']+/papers/[^']+\.pdf)'",chunk);ab=re.search(r"align='justify'>(.*?)(?:<p/>|</p>|</div>)",chunk,re.S)
            if t:rows.append({'title':clean(t.group(1)),'authors':'; '.join(a.strip() for a in re.split(r'[;,]',clean(t.group(2))) if a.strip()),'pdf':absolute(pdf.group(1)) if pdf else '','abstract':clean(ab.group(1)) if ab else ''})
    elif year in(2015,2016):
        for pdf,title,ab,authors in re.findall(r'href="(proceedings/papers/[^"]+\.pdf)".*?<div class="collapse" tabindex=1><b>(.*?)</b>\s*\+<div>(.*?)</div></div><i>(.*?)</i>',page,re.S):
            rows.append({'title':clean(title),'authors':split_authors(clean(authors)),'pdf':absolute(pdf),'abstract':clean(ab)})
    elif year==2014:
        for pdf,title,authors in re.findall(r'href="(proceedings/individuals/[^"]+\.pdf)">Download</a><br/>Title:(.*?)<br/>Authors:\s*<i>(.*?)</i>',page,re.S):
            rows.append({'title':clean(title),'authors':split_authors(clean(authors)),'pdf':absolute(pdf),'abstract':''})
    elif year==2013:
        for pdf,title,authors in re.findall(r'href="(prints/papers/[^"]+\.pdf)">ID: \d+</a><br/>Title:(.*?)<br/>Authors:\s*<i>(.*?)</i>',page,re.S):
            rows.append({'title':clean(title),'authors':'; '.join(a.strip() for a in clean(authors).split(',') if a.strip()),'pdf':absolute(pdf),'abstract':''})
    elif year==2011:
        for pdf,title,authors in re.findall(r'<tr><td><a href="([^"]+\.pdf)">(.*?)</a></td><td>(.*?)</td></tr>',page,re.S):
            rows.append({'title':clean(title),'authors':'; '.join(a.strip() for a in clean(authors).split(',') if a.strip()),'pdf':pdf,'abstract':''})
    return rows
NS={'a':'http://www.w3.org/2005/Atom'}
def arxiv_by_title(title):
    q=re.sub(r'\s+',' ',re.sub(r'[^A-Za-z0-9\- ]',' ',title)).strip()
    text=fetch('https://export.arxiv.org/api/query?max_results=5&search_query='+quote('ti:"'+q+'"'),pause=3.2)
    try:entries=ET.fromstring(text).findall('a:entry',NS)
    except ET.ParseError:return None
    for e in entries:
        if norm(e.findtext('a:title',namespaces=NS))==norm(title):
            return {'id':re.sub(r'v\d+$','',e.findtext('a:id',namespaces=NS).rsplit('/',1)[-1]),'abstract':clean(e.findtext('a:summary',namespaces=NS))}

def main():
    ap=argparse.ArgumentParser();ap.add_argument('--write',action='store_true');args=ap.parse_args()
    lib=json.loads((ROOT/'data/library.json').read_text(encoding='utf-8'));cit=json.loads((ROOT/'data/citations.json').read_text(encoding='utf-8'))
    index={norm(p['title']):p for p in lib['papers']};keys=list(index)
    lists=[]
    for venue,years in sorted(pmlr_volumes().items()):
        for year,url in sorted(years.items()):lists.append((venue,year,url,pmlr_list(url),'pmlr'))
    for year,url in UAI_PAGES.items():lists.append(('UAI',year,url,uai_list(year,url),'uai-site'))
    tmlr=json.loads((ROOT/'data/journals/tmlr.json').read_text(encoding='utf-8'))
    for year in sorted({p['year'] for p in tmlr['papers']}):
        rows=[{'title':p['title'],'authors':'; '.join(a['name'] for a in p.get('authors',[])),'url':p['official_url'],'pdf':p.get('pdf_url',''),'journal_id':p['id']} for p in tmlr['papers'] if p['year']==year]
        lists.append(('TMLR',year,'https://jmlr.org/tmlr/papers/',rows,'tmlr'))
    new,present,near,coverage=[],[],[],[]
    for venue,year,url,rows,kind in lists:
        if not rows:raise SystemExit(f'{venue} {year}: empty paper list from {url}; nothing written')
        matches=[r for r in rows if PAT.search(r['title'])];added=0
        for r in matches:
            n=norm(r['title'])
            if n in index:present.append((venue,year,r['title'],index[n]['id']));continue
            close=difflib.get_close_matches(n,keys,n=1,cutoff=0.9)
            if close and index[close[0]]['venue'] in(venue,'') and (not index[close[0]]['year'] or abs(index[close[0]]['year']-year)<=1):
                near.append((venue,year,r['title'],index[close[0]]['id'],index[close[0]]['title']));continue
            new.append((venue,year,url,kind,r));index[n]={'id':'pending','venue':venue,'year':year};added+=1
        coverage.append({'source_id':f'PROC-{venue}-{year}','venue':venue,'year':year,'phase':f'{TODAY} 官方论文目录题名检索','catalog_url':url,'retrieved_date':TODAY,'candidate_count':len(matches),'included_count':added,'status':'已完成目录核查','scope':'官方完整论文目录按原题名任务词检索；不等于摘要语义穷尽','catalog_papers':len(rows)})
        print(f'{venue} {year}: {len(rows)} papers, {len(matches)} title matches, {added} new')
    # TMLR began in 2022; earlier years are marked rather than shown as unscreened.
    first_tmlr=min(c['year'] for c in coverage if c['venue']=='TMLR')
    coverage+=[{'source_id':f'PROC-TMLR-{y}','venue':'TMLR','year':y,'phase':f'{TODAY} 官方论文目录题名检索','catalog_url':'https://jmlr.org/tmlr/','retrieved_date':TODAY,'candidate_count':0,'included_count':0,'status':f'尚未创办（TMLR {first_tmlr} 年创刊）','scope':'期刊创刊前','catalog_papers':0} for y in range(2010,first_tmlr)]
    records=[]
    for venue,year,url,kind,r in new:
        abstract,abs_ev,arxiv='','',''
        if kind=='pmlr':
            abstract=pmlr_abstract(r['url']);abs_ev=f"{r['url']}；{TODAY} 官方论文页面原文"
        elif kind=='uai-site':
            abstract=r.get('abstract','');abs_ev=f'{url}；{TODAY} 官方录用论文页面原文'
        if not abstract:
            hit=arxiv_by_title(r['title'])
            if hit:arxiv=hit['id'];abstract=hit['abstract'];abs_ev=f"https://arxiv.org/abs/{arxiv}；{TODAY} arXiv API（arXiv 版本摘要，题名一致）"
        page=r.get('url') or r.get('pdf') or url
        listing=f'{url}；{TODAY} 官方论文目录'
        p={'id':pid(r['title']),'title':r['title'],'year':year,'venue':venue,'authors':r['authors'],'abstract':abstract,'ai_summary':'','tasks':'','methods':'','domains':'','data_types':'',
           'status':'正式来源已核验' if kind in('pmlr','tmlr') else '书目部分核验；展示已核验','acceptance':'正式会议与年份已核验' if kind in('pmlr','tmlr') else '官方会议展示已核验；Track/正式发表待核验',
           'doi':'','arxiv':arxiv,'official_url':page,'main_url':page,'pdf_url':r.get('pdf',''),'code_url':'','project_url':'','source_urls':[url],
           'evidence':{'title':f'{page}；{TODAY} 官方论文目录','authors':f'{page}；{TODAY} 官方论文目录','venue':listing,'year':listing},'stage':f'{TODAY} 官方论文目录补查','conflicts':[],'verified_date':TODAY,'paper_notes':None,'abstract_gist':gist(abstract),'keywords':'','scope_status':''}
        if kind=='tmlr':
            ev=f"{url}；本库期刊集合 {r['journal_id']}（TMLR 官方录用目录）";p['evidence'].update(title=ev,authors=ev,venue=ev,year=ev)
        if r.get('pdf'):p['evidence']['pdf_url']=f'{page}；{TODAY} 官方论文页面'
        if arxiv:p['evidence']['arxiv']=f'https://arxiv.org/abs/{arxiv}；{TODAY} arXiv API，题名一致'
        if abstract:
            p['evidence']['abstract']=abs_ev;p['evidence']['abstract_gist']=abs_ev.split('；')[0]+'；英文摘要原文摘句，未生成中文结论'
        p.update(classify(' '.join([p['title'],abstract])))
        p['scope_status']='直接主题信号' if re.search(SCOPE,' '.join([p['title'],abstract]),re.I) else '主题边界待核对'
        records.append(p)
    ids={p['id'] for p in lib['papers']}
    for p in records:assert p['id'] not in ids,p['title'];ids.add(p['id'])
    summary={'lists':len(lists),'title_matches':sum(c['candidate_count'] for c in coverage),'already_present':len(present),'near_duplicates':len(near),'added':len(records),
             'by_venue':dict(collections.Counter(p['venue'] for p in records)),'in_scope':sum(p['scope_status']=='直接主题信号' for p in records),'abstracts':sum(bool(p['abstract']) for p in records),'mode':'write' if args.write else 'dry-run'}
    print(json.dumps(summary,ensure_ascii=False,indent=1))
    (CACHE/'report.json').write_text(json.dumps({'summary':summary,'near':near,'present':present,'coverage':coverage},ensure_ascii=False,indent=1))
    if not args.write:return
    lib['papers'].extend(records)
    screened={(c['venue'],c['year']) for c in coverage}
    lib['coverage']=[c for c in lib['coverage'] if (c['venue'],c['year']) not in screened]+coverage
    for venue in ['AISTATS','UAI','TMLR']:
        if venue not in lib['coverage_venues']:lib['coverage_venues'].append(venue)
    for p in records:cit['records'][p['id']]={'cited_by_count':None,'status':'unmatched','source':'OpenAlex','note':f'Added {TODAY} after the citation snapshot; not queried yet'}
    cit['meta']['records']=len(lib['papers']);cit['meta']['unknown']=len(lib['papers'])-cit['meta']['matched']
    (ROOT/'data/library.json').write_text(json.dumps(lib,ensure_ascii=False,separators=(',',':'))+'\n',encoding='utf-8')
    (ROOT/'data/citations.json').write_text(json.dumps(cit,ensure_ascii=False,indent=2),encoding='utf-8')
    print('written: data/library.json, data/citations.json')
if __name__=='__main__':main()
