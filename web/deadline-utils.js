(function(root){
 'use strict';
 const KINDS=['abstract','paper','rebuttal','decision'],SUBMISSION=['abstract','paper'],DAY=864e5;
 const time=x=>x&&x.utc?Date.parse(x.utc):NaN;
 // One row per dated event of every edition, earliest first.
 function events(data){const out=[];
  for(const v of data.venues||[])for(const e of v.editions||[])(e.rounds||[]).forEach((r,index)=>{for(const kind of KINDS){const t=time(r[kind]);if(!Number.isNaN(t))out.push({venue:v,edition:e,round:r,index,kind,time:t})}});
  return out.sort((a,b)=>a.time-b.time||a.venue.name.localeCompare(b.venue.name))}
 const matches=(v,state)=>(!state.area||v.area===state.area)&&(!state.coverage||v.coverage)&&(!state.query||[v.name,v.full_name].join(' ').toLowerCase().includes(state.query.trim().toLowerCase()));
 // Rounds that still have a submission step ahead; a round stays listed until its paper deadline has passed.
 function upcoming(data,now,state={}){const out=[];
  for(const v of data.venues||[]){if(!matches(v,state))continue;
   for(const e of v.editions||[])(e.rounds||[]).forEach((r,index)=>{const open=SUBMISSION.map(k=>time(r[k])).filter(t=>t>=now);if(!open.length)return;
    const later=state.reviews?['rebuttal','decision'].filter(k=>r[k]&&r[k].utc):[];out.push({venue:v,edition:e,round:r,index,next:Math.min(...open),nextKind:SUBMISSION.find(k=>time(r[k])>=now),later})})}
  return out.sort((a,b)=>a.next-b.next||a.venue.name.localeCompare(b.venue.name))}
 // Review-stage dates still ahead for rounds whose submission has closed.
 function reviewDates(data,now,state={}){return events(data).filter(x=>x.time>=now&&!SUBMISSION.includes(x.kind)&&matches(x.venue,state)&&!SUBMISSION.some(k=>time(x.round[k])>=now))}
 function remaining(target,now){const ms=target-now;if(ms<0)return {past:true,days:0,hours:0};return {past:false,days:Math.floor(ms/DAY),hours:Math.floor(ms%DAY/36e5)}}
 const years=data=>[...new Set((data.venues||[]).flatMap(v=>v.editions.map(e=>e.year)))].sort((a,b)=>a-b);
 // Paper deadlines of one edition for the venue × year table.
 function cell(venue,year){const e=(venue.editions||[]).find(x=>x.year===year);if(!e)return null;
  const dates=e.rounds.map(r=>r.paper).filter(Boolean);return {edition:e,dated:dates.filter(d=>d.utc).map(d=>({date:d.local.slice(0,10),time:Date.parse(d.utc)})),pending:dates.filter(d=>!d.utc).length}}
 const stamp=t=>new Date(t).toISOString().replace(/[-:]/g,'').replace(/\.\d{3}/,'');
 const text=s=>String(s??'').replace(/\\/g,'\\\\').replace(/\r?\n/g,'\\n').replace(/([,;])/g,'\\$1');
 // iCalendar file with one timed entry per upcoming submission deadline.
 function ics(rows,now,labels={abstract:'abstract deadline',paper:'paper deadline'}){const lines=['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//time-space-literature-library//deadlines//EN','CALSCALE:GREGORIAN'];
  for(const row of rows)for(const kind of SUBMISSION){const t=time(row.round[kind]);if(Number.isNaN(t)||t<now)continue;
   lines.push('BEGIN:VEVENT','UID:'+[row.venue.id,row.edition.year,row.index,kind].join('-')+'@time-space-literature-library','DTSTAMP:'+stamp(now),'DTSTART:'+stamp(t),'DTEND:'+stamp(t),'SUMMARY:'+text(`${row.venue.name} ${row.edition.year} ${labels[kind]}${row.round.label?' ('+row.round.label+')':''}`),'DESCRIPTION:'+text(`${row.round[kind].local} ${row.edition.timezone}. Check the official call for papers.`),...(/^https?:\/\//.test(row.edition.official_url)?['URL:'+row.edition.official_url]:[]),'END:VEVENT')}
  lines.push('END:VCALENDAR');return lines.join('\r\n')+'\r\n'}
 const api={KINDS,events,upcoming,reviewDates,remaining,years,cell,ics,matches};root.DeadlineUtils=api;if(typeof module!=='undefined')module.exports=api;
})(typeof window==='undefined'?globalThis:window);
