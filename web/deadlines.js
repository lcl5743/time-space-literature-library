'use strict';
(() => {
 const U=window.DeadlineUtils,data=window.DEADLINE_DATA,$=s=>document.querySelector(s),esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const dictionary={
 workspace:['工作空间','WORKSPACE'],conference:['◫ 会议与时空文献库','◫ Conference & time-space library'],journals:['▤ 统计期刊','▤ Statistics journals'],deadlines:['◷ 投稿截止','◷ Deadlines'],sideNote:['截止时间来自社区维护的公开清单，投稿前请以会议官网为准。','Deadlines come from a community-maintained public list. Check the official call for papers before submitting.'],
 heading:['会议投稿截止时间','Conference submission deadlines'],intro:['文献库所涉会议历年的摘要与论文截止时间，以及评审与录用通知日期。按最近的截止时间排序。','Abstract and paper deadlines, with review and decision dates, for the conferences in this library. Sorted by the nearest deadline.'],
 notice:['日期取自社区维护的 ccfddl/ccf-deadlines 清单，本站没有逐条对照征稿通知核验。每届会议都保留官网链接，以官网为准；标为“待公布”的日期尚未发布。','Dates are copied from the community-maintained ccfddl/ccf-deadlines list and are not verified one by one against each call for papers. Every edition keeps its official link, which is the authority. “To be announced” means the date is not published yet.'],
 area:['领域','Area'],scope:['会议范围','Venues'],search:['搜索会议名称','Search venue names'],reviews:['显示评审与录用通知日期','Show review and decision dates'],reset:['重置筛选','Reset filters'],calendar:['↓ 导出日历 (.ics)','↓ Export calendar (.ics)'],
 upcoming:['即将截止的投稿','Upcoming submission deadlines'],reviewHeading:['已截稿会议的后续日期','Review-stage dates after submission closed'],tableHeading:['会议 × 年份：论文截止日期','Venue × year: paper deadlines'],years:['年份','Years'],recentYears:['最近四届','Latest four editions'],allYearsOption:['全部年份','All years'],
 tableNote:['列为会议举办年份；格内是该届的论文截止日期（按原时区）。多轮投稿逐轮列出，按月滚动的只显示首末两轮。','Columns are conference years. Cells show that edition’s paper deadlines in the original time zone. Multi-round venues list each round; monthly rolling venues show the first and last round.'],
 journalHeading:['期刊投稿','Journal submissions'],journalNote:['本站收录的期刊没有统一的年度截稿日期，多数常年接收投稿；专刊、特邀稿件另有安排，本站没有逐刊核对。请到期刊官网查看投稿说明。','The journals in this library have no shared annual deadline; most accept submissions year-round, while special issues and invited content follow their own schedules. These policies were not checked journal by journal here. See each journal’s site for submission instructions.'],
 methodHeading:['数据来源与更新方式','Data source and updates'],download:['↓ 下载截止时间数据 JSON','↓ Download deadline data (JSON)'],footer:['仅供投稿规划参考。时间以会议官网公布为准。','For planning only. The official conference site is authoritative.'],
 allAreas:['全部领域','All areas'],allVenues:['全部会议','All venues'],coverageVenues:['仅 15 个系统检索会议','Only the 15 systematically screened venues'],
 ml:['机器学习','Machine learning'],ai:['人工智能','Artificial intelligence'],data:['数据挖掘 / 数据库 / 检索','Data mining / databases / IR'],vision:['计算机视觉 / 多媒体','Computer vision / multimedia'],nlp:['自然语言处理','Natural language processing'],
 abstract:['摘要截止','Abstract deadline'],paper:['论文截止','Paper deadline'],rebuttal:['Rebuttal 截止','Rebuttal deadline'],decision:['录用通知','Decision'],
 statUpcoming:['个即将截止的投稿轮次','upcoming submission rounds'],statNext:['最近的截止','Nearest deadline'],statVenues:['个会议','venues'],statEditions:['届会议记录','editions recorded'],none:['暂无','None'],
 days:['天','days'],hours:['小时','hours'],left:['还有','in'],today:['不到 1 小时','under 1 hour'],local:['你的本地时间','Your local time'],official:['会议官网 ↗','Official site ↗'],round:['轮次','Round'],rounds:['轮','rounds'],tba:['待公布','To be announced'],passed:['已截止','closed'],
 venue:['会议','Venue'],event:['事项','Event'],date:['日期（原时区）','Date (original time zone)'],noResults:['没有符合当前筛选的即将截止投稿。','No upcoming submission deadlines match these filters.'],retrieved:['数据获取于','Data retrieved'],conferenceDates:['会期','Conference'],
 method:['来源：{source}（{license} 许可，社区维护），固定版本 {commit}，获取于 {date}。运行 npm run deadlines:collect 可重新获取；获取失败或来源中某届会议消失时不会覆盖现有数据。','Source: {source} ({license} licence, community-maintained), pinned at {commit}, retrieved {date}. Run npm run deadlines:collect to refresh; a failed fetch or an edition missing from the source never overwrites the current data.']};
 let lang='zh';try{lang=new URLSearchParams(location.search).get('lang')||localStorage.getItem('time-space-language')||'zh'}catch{}if(!['zh','en'].includes(lang))lang='zh';
 const T=k=>dictionary[k]?dictionary[k][lang==='en'?1:0]:k,N=n=>Number(n).toLocaleString('en-US');
 const state={area:'',coverage:false,query:'',reviews:false,years:'recent'},now=()=>Date.now();
 const safeLink=(url,name)=>{try{const u=new URL(url);return ['https:','http:'].includes(u.protocol)?`<a href="${esc(u.href)}" target="_blank" rel="noopener noreferrer">${esc(name)}</a>`:''}catch{return ''}};
 const original=(d,tz)=>d.utc?`${d.local.slice(0,16)} ${tz}`:T('tba');
 const localTime=utc=>{const p=Object.fromEntries(new Intl.DateTimeFormat('en-GB',{year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23',timeZoneName:'short'}).formatToParts(new Date(utc)).map(x=>[x.type,x.value]));return `${p.year}-${p.month}-${p.day} ${p.hour}:${p.minute} ${p.timeZoneName}`};
 const unit=(n,k)=>lang==='en'&&n===1?T(k).replace(/s$/,''):T(k);
 const countdown=t=>{const r=U.remaining(t,now());return r.days?`${T('left')} ${r.days} ${unit(r.days,'days')}`:r.hours?`${T('left')} ${r.hours} ${unit(r.hours,'hours')}`:T('today')};
 const urgency=t=>{const d=U.remaining(t,now()).days;return d<=7?'soon':d<=30?'near':''};
 const options=(items,value)=>items.map(([id,name])=>`<option value="${esc(id)}" ${String(id)===String(value)?'selected':''}>${esc(name)}</option>`).join('');
 function card(row){const {venue:v,edition:e,round:r}=row,kinds=['abstract','paper',...row.later];
  return `<article class="journal-card deadline-card ${urgency(row.next)}"><div class="deadline-main"><div class="paper-top"><span class="venue-tag">${esc(v.name)} ${e.year}</span>${r.label?`<span class="tag">${esc(r.label)}</span>`:''}</div><h3>${esc(v.full_name||v.name)}</h3><dl>${kinds.filter(k=>r[k]).map(k=>`<dt>${T(k)}</dt><dd class="${r[k].utc&&Date.parse(r[k].utc)<now()?'deadline-passed':''}">${esc(original(r[k],e.timezone))}${r[k].utc&&Date.parse(r[k].utc)<now()?` · ${T('passed')}`:''}${r[k].utc?`<small>${T('local')}: ${esc(localTime(r[k].utc))}</small>`:''}</dd>`).join('')}</dl><p>${e.conference_dates?`${T('conferenceDates')}: ${esc(e.conference_dates)}${e.place?' · '+esc(e.place):''} · `:''}${safeLink(e.official_url,T('official'))}</p></div><div class="deadline-count"><b>${esc(countdown(row.next))}</b><span>${T(row.nextKind)}</span></div></article>`}
 function table(){const all=U.years(data),years=state.years==='all'?all:all.slice(-4),venues=data.venues.filter(v=>U.matches(v,state));
  const cell=(v,y)=>{const c=U.cell(v,y);if(!c)return '<td class="deadline-empty">—</td>';
   let dated=c.dated;const total=dated.length;if(total>4)dated=[dated[0],dated[total-1]];
   const lines=dated.map(d=>`<span class="${d.time<now()?'deadline-passed':'deadline-open'}">${d.date}</span>`);if(total>4)lines.splice(1,0,`<small>… ${total} ${T('rounds')}</small>`);if(c.pending)lines.push(`<span class="deadline-open">${T('tba')}</span>`);
   const body=lines.join('')||'—';let href='';try{const u=new URL(c.edition.official_url);if(['https:','http:'].includes(u.protocol))href=u.href}catch{}
   return `<td>${href?`<a href="${esc(href)}" target="_blank" rel="noopener noreferrer" title="${esc(v.name+' '+y)}">${body}</a>`:body}</td>`};
  $('#deadlineTable').innerHTML=`<table><thead><tr><th>${T('venue')}</th>${years.map(y=>`<th>${y}</th>`).join('')}</tr></thead><tbody>${venues.map(v=>`<tr><th scope="row">${esc(v.name)}</th>${years.map(y=>cell(v,y)).join('')}</tr>`).join('')}</tbody></table>`}
 function render(){const rows=U.upcoming(data,now(),state),everything=U.upcoming(data,now(),{}),reviews=state.reviews?U.reviewDates(data,now(),state):[];
  $('#deadlineStats').innerHTML=[[N(everything.length),T('statUpcoming')],[everything[0]?`${everything[0].venue.name} ${everything[0].edition.year}`:T('none'),everything[0]?`${T('statNext')} · ${countdown(everything[0].next)}`:T('statNext')],[N(data.venues.length),T('statVenues')],[N(data.venues.reduce((n,v)=>n+v.editions.length,0)),T('statEditions')]].map(([n,l])=>`<div><b>${esc(n)}</b><span>${esc(l)}</span></div>`).join('');
  $('#deadlineCount').textContent=N(rows.length);$('#deadlineList').innerHTML=rows.map(card).join('')||`<div class="journal-empty">${T('noResults')}</div>`;
  $('#deadlineReviewBlock').hidden=!reviews.length;$('#deadlineReviewCount').textContent=N(reviews.length);
  $('#deadlineReviewList').innerHTML=reviews.length?`<table><thead><tr><th>${T('venue')}</th><th>${T('event')}</th><th>${T('date')}</th><th>${T('local')}</th><th></th></tr></thead><tbody>${reviews.map(x=>`<tr><th scope="row">${esc(x.venue.name)} ${x.edition.year}</th><td>${T(x.kind)}${x.round.label?' · '+esc(x.round.label):''}</td><td>${esc(original(x.round[x.kind],x.edition.timezone))}</td><td>${esc(localTime(x.round[x.kind].utc))}</td><td>${esc(countdown(x.time))}</td></tr>`).join('')}</tbody></table>`:'';
  table()}
 function translate(){document.documentElement.lang=lang==='en'?'en':'zh-CN';document.title=lang==='en'?'Deadlines · Time × Space':'投稿截止 · Time × Space';document.querySelectorAll('[data-t]').forEach(el=>el.textContent=T(el.dataset.t));
  $('#deadlineLanguage').value=lang;$('#deadlineNotice').textContent=T('notice');$('#deadlineRetrieved').textContent=`${T('retrieved')} ${data.retrieved_at.slice(0,10)}`;
  const years=U.years(data);$('#deadlineRange').textContent=`${years[0]}—${years.at(-1)}`;
  $('#deadlineArea').innerHTML=options([['',T('allAreas')],...[...new Set(data.venues.map(v=>v.area))].map(a=>[a,T(a)])],state.area);
  $('#deadlineScope').innerHTML=options([['',T('allVenues')],['coverage',T('coverageVenues')]],state.coverage?'coverage':'');
  $('#deadlineYears').innerHTML=options([['recent',T('recentYears')],['all',T('allYearsOption')]],state.years);
  $('#deadlineMethod').textContent=T('method').replace('{source}',data.source.name).replace('{license}',data.source.license).replace('{commit}',data.source.commit.slice(0,7)).replace('{date}',data.retrieved_at.slice(0,10));
  $('#deadlineJournalList').innerHTML=(data.journals||[]).map(j=>`<li>${safeLink(j.official_url,j.title)||esc(j.title)}</li>`).join('');render()}
 $('#deadlineLanguage').onchange=e=>{lang=e.target.value;try{localStorage.setItem('time-space-language',lang)}catch{}translate()};
 $('#deadlineArea').onchange=e=>{state.area=e.target.value;render()};$('#deadlineScope').onchange=e=>{state.coverage=e.target.value==='coverage';render()};
 $('#deadlineSearch').oninput=e=>{state.query=e.target.value;render()};$('#deadlineReviews').onchange=e=>{state.reviews=e.target.checked;render()};$('#deadlineYears').onchange=e=>{state.years=e.target.value;table()};
 $('#deadlineReset').onclick=()=>{Object.assign(state,{area:'',coverage:false,query:'',reviews:false});$('#deadlineSearch').value='';$('#deadlineReviews').checked=false;translate()};
 $('#deadlineICS').onclick=()=>{const blob=new Blob([U.ics(U.upcoming(data,now(),state),now(),{abstract:T('abstract'),paper:T('paper')})],{type:'text/calendar;charset=utf-8'}),a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='submission-deadlines.ics';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000)};
 translate();setInterval(render,6e5);
})();
