import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {type HimawariArchive,type Chronology,airportEvidenceAt} from '../apps/web/src/data/event.ts';
const read=(path:string)=>JSON.parse(readFileSync(path,'utf8'));
const hash=(bytes:Buffer)=>createHash('sha256').update(bytes).digest('hex');
test('event imagery preserves every advertised frame or explicit gap with original checksums',()=>{
 const a:HimawariArchive=read('public/data/himawari.json');assert.equal(a.complete,true);assert.equal(a.failedRequests.length,0);assert.equal(a.frames.length,579);assert.equal(a.unavailableTimes.length,10);
 const times=new Set(a.frames.map(f=>f.time));assert.equal(times.size,a.frames.length);
 for(let t=Date.parse(a.start);t<=Date.parse(a.end);t+=600000)assert.equal(Number(times.has(t))+Number(a.unavailableTimes.some(g=>Date.parse(g)===t)),1);
 for(const f of a.frames){const bytes=readFileSync(`public${f.url}`);assert.equal(hash(bytes),f.sha256);assert.equal(bytes.readUInt32BE(16),a.width);assert.equal(bytes.readUInt32BE(20),a.height);assert.equal(Date.parse(f.sourceTime),f.time);}
});
test('retrospective airport evidence expires to unknown rather than inventing reopening',()=>{
 const c:Chronology=read('public/data/chronology.json');
 for(const source of c.sources)assert.equal(hash(readFileSync(source.localPath)),source.sha256);
 const airport=c.airports.find(a=>a.closureListed&&a.reopenedAt)!;
 assert.equal(airportEvidenceAt(airport,c,Date.parse(c.closureReport!.closedBy)-1),'unknown');
 assert.equal(airportEvidenceAt(airport,c,Date.parse(c.closureReport!.closedBy)),'scheduled-closure');
 assert.equal(airportEvidenceAt(airport,c,Date.parse(c.closureReport!.plannedUntil)),'unknown');
 assert.equal(airportEvidenceAt(airport,c,Date.parse(airport.reopenedAt!)),'reopening-reported');
 assert.ok(c.airports.some(a=>a.closureListed&&!a.reopenedAt));assert.ok(c.airports.some(a=>!a.closureListed&&a.reopenedAt));
});
test('missing closure evidence stays unknown while an explicit reopening remains usable',()=>{
 const c:Chronology=read('public/data/chronology.json');c.closureReport=null;
 const airport=c.airports.find(a=>a.closureListed&&a.reopenedAt)!;
 assert.equal(airportEvidenceAt(airport,c,Date.parse(airport.reopenedAt!)-1),'unknown');
 assert.equal(airportEvidenceAt(airport,c,Date.parse(airport.reopenedAt!)),'reopening-reported');
});
