const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const U=require('../web/deadline-utils.js'),root=path.join(__dirname,'..');
const read=p=>JSON.parse(fs.readFileSync(path.join(root,p),'utf8'));
(async()=>{
 const {parseYaml,toUTC,normalizeVenue}=await import('../scripts/collect-deadlines.mjs');
 // Source format: one conference entry with editions, multi-round timelines, comments and quoted values.
 const sample=`- title: DEMO # trailing comment
  description: 'Demo Conference: Time & Space'
  rank:
    ccf: A
  confs:
    - year: 2026
      id: demo26
      link: https://example.org/2026#cfp
      timeline:
        - abstract_deadline: '2025-09-19 23:59:59'
          deadline: '2025-09-24 23:59:59'
          comment: first round
        - deadline: 'TBD'
      timezone: AoE
      date: April 23-25, 2026
      place: Rio de Janeiro, Brazil
    - year: 2025
      link: https://example.org/2025
      timeline:
      - deadline: '2025-03-01 17:00:00'
      timezone: PT
`;
 const parsed=parseYaml(sample);assert.equal(parsed.length,1);assert.equal(parsed[0].title,'DEMO');assert.equal(parsed[0].description,'Demo Conference: Time & Space');assert.equal(parsed[0].confs[0].link,'https://example.org/2026#cfp');assert.equal(parsed[0].confs[0].timeline.length,2);
 assert.throws(()=>parseYaml('a: |\n  block text'),/Unsupported/,'Unsupported YAML must fail loudly instead of guessing');
 // Published wall-clock times resolve to one instant; daylight saving follows the named zone.
 assert.equal(toUTC('2025-09-24 23:59:59','AoE'),'2025-09-25T11:59:59Z');assert.equal(toUTC('2025-09-24 23:59:59','UTC-12'),'2025-09-25T11:59:59Z');
 assert.equal(toUTC('2026-05-07 11:59:59','UTC+0'),'2026-05-07T11:59:59Z');assert.equal(toUTC('2026-01-01 08:00:00','UTC+8'),'2026-01-01T00:00:00Z');
 assert.equal(toUTC('2025-03-01 17:00:00','PT'),'2025-03-02T01:00:00Z');assert.equal(toUTC('2025-07-01 17:00:00','PT'),'2025-07-02T00:00:00Z');
 assert.equal(toUTC('TBD','AoE'),null);assert.equal(toUTC('2025-03-01 17:00:00','Mars/Olympus'),null,'Unknown zones stay unresolved');
 const venue=normalizeVenue({id:'demo',name:'DEMO',area:'ml',coverage:true,file:'conference/AI/demo.yml'},parsed[0]);
 assert.deepEqual(venue.editions.map(e=>e.year),[2025,2026]);assert.equal(venue.editions[1].rounds[0].label,'first round');assert.deepEqual(venue.editions[1].rounds[1].paper,{local:null,utc:null,note:'TBD'});
 // Page logic on a fixed clock.
 const data={venues:[venue]},at=s=>Date.parse(s);
 let rows=U.upcoming(data,at('2025-09-21T00:00:00Z'));assert.equal(rows.length,1);assert.equal(rows[0].nextKind,'paper','A closed abstract deadline does not hide the open paper deadline');
 assert.equal(U.upcoming(data,at('2025-09-25T11:59:59Z')).length,1,'The deadline instant itself still counts as open');assert.equal(U.upcoming(data,at('2025-09-25T12:00:00Z')).length,0);
 assert.equal(U.upcoming(data,at('2025-01-01T00:00:00Z'),{area:'vision'}).length,0);assert.equal(U.upcoming(data,at('2025-01-01T00:00:00Z'),{query:'time & space'}).length,2);
 assert.deepEqual(U.remaining(at('2025-09-25T11:59:59Z'),at('2025-09-22T10:59:59Z')),{past:false,days:3,hours:1});assert.equal(U.remaining(1,2).past,true);
 const c=U.cell(venue,2026);assert.deepEqual(c.dated.map(d=>d.date),['2025-09-24']);assert.equal(c.pending,1);assert.equal(U.cell(venue,2030),null);
 const ics=U.ics(U.upcoming(data,at('2025-09-01T00:00:00Z')),at('2025-09-01T00:00:00Z'));
 assert.match(ics,/BEGIN:VEVENT\r\nUID:demo-2026-0-abstract@/);assert.match(ics,/DTSTART:20250925T115959Z/);assert.match(ics,/SUMMARY:DEMO 2026 paper deadline \(first round\)/);assert.ok(!/TBD/.test(ics),'Undated rounds are not exported');
 // Stored snapshot: every scoped venue present, instants consistent with the published local time.
 const stored=read('data/deadlines.json'),scope=read('data/deadline-scope.json');
 assert.deepEqual(stored.venues.map(v=>v.id),scope.venues.map(v=>v.id));assert.equal(new Set(stored.venues.map(v=>v.id)).size,stored.venues.length);assert.match(stored.source.commit,/^[0-9a-f]{40}$/);assert.ok(!Number.isNaN(Date.parse(stored.retrieved_at)));
 const library=read('data/library.json'),journals=new Set(read('data/journal-scope.json').journals.map(j=>j.id.toUpperCase()));for(const name of library.coverage_venues.filter(n=>!journals.has(n)))assert.ok(stored.venues.some(v=>v.name===name&&v.coverage),`Coverage venue ${name} has no deadline record`);
 let dated=0;
 for(const v of stored.venues){assert.ok(v.editions.length,`${v.name} has no editions`);
  for(const e of v.editions){assert.ok(Number.isInteger(e.year));assert.match(e.official_url,/^https?:\/\//,`${v.name} ${e.year} lacks an official link`);
   for(const r of e.rounds)for(const k of U.KINDS){const d=r[k];if(!d)continue;if(d.local===null){assert.equal(d.utc,null);assert.ok(d.note);continue}
    assert.equal(d.utc,toUTC(d.local,e.timezone),`${v.name} ${e.year} ${k}: stored instant differs from its local time`);dated++}}}
 assert.ok(dated>300);
 assert.equal(read('dist/deadlines.json').venues.length,stored.venues.length);
 const page=fs.readFileSync(path.join(root,'dist/deadlines-data.js'),'utf8');assert.ok(page.startsWith('window.DEADLINE_DATA='));
 assert.equal(JSON.parse(page.slice('window.DEADLINE_DATA='.length).trim().replace(/;$/,'')).journals.length,read('data/journal-scope.json').journals.length);
 console.log(`Deadline parsing, time zones, page logic and stored snapshot passed (${stored.venues.length} venues, ${dated} dated entries)`);
})().catch(e=>{console.error(e);process.exit(1)});
