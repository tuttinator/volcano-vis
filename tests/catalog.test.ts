import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {type Catalog,editions} from '../apps/web/src/data/types.ts';
const catalog:Catalog=JSON.parse(readFileSync('public/data/catalog.json','utf8'));
test('Merapi archive preserves unidentifiable ash and its later archive start',()=>{
 const list=editions(catalog,'263250');assert.equal(list.length,10);
 assert.equal(list[0].issuedAt,Date.parse('2023-03-12T15:50:00Z'));
 assert.equal(list.filter(p=>p.leadStates['0'].status==='not-identifiable').length,6);
 assert.equal(list.at(-1)!.components.length,0);
 assert.equal(catalog.events.find(e=>e.volcanoId==='263250')!.basis,'archive');
});
test('catalog is traceable to the retained factual input and covers six named volcanoes',()=>{
 assert.equal(catalog.inputSha256,createHash('sha256').update(readFileSync('data/raw/darwin-factual-extract-2026-09-12.json')).digest('hex'));
 assert.deepEqual(catalog.volcanoes.map(v=>v.name).sort(),['Anak Krakatau','Dukono','Ibu','Lewotolok','Merapi','Semeru']);
 assert.equal(catalog.products.length,104);assert.equal(catalog.products.flatMap(p=>p.components).length,470);
});
test('TAC degree/minute positions and valid timestamps survive normalization',()=>{
 const p=catalog.products.find(p=>p.volcanoId==='268010'&&p.number==='2026/742')!;
 assert.equal(p.estimated,true);assert.equal(p.observedAt,Date.parse('2026-09-12T06:40:00Z'));
 assert.deepEqual(p.components[0].coordinates[0],[127.733333,1.683333]);
 assert.equal(p.components[1].validAt,Date.parse('2026-09-12T12:40:00Z'));
 assert.notEqual(p.components[1].validAt,p.issuedAt+6*3600000);
});
test('correction replaces earlier edition while retaining both for inspection',()=>{
 const family=catalog.products.filter(p=>p.volcanoId==='262000'&&p.number==='2026/215');assert.equal(family.length,2);
 assert.equal(family[0].supersededBy,family[1].id);assert.equal(family[1].flags.correction,true);
 assert.equal(editions(catalog,'262000').filter(p=>p.number==='2026/215').length,1);
});
test('all geometries are closed, plausible and uniquely identified',()=>{
 const ids=new Set<string>();for(const p of catalog.products)for(const c of p.components){assert.ok(!ids.has(c.id));ids.add(c.id);assert.deepEqual(c.coordinates[0],c.coordinates.at(-1));assert.ok(c.coordinates.length>=4);assert.ok(c.lower<c.upper);for(const [x,y]of c.coordinates){assert.ok(x>65&&x<141);assert.ok(y>-30&&y<15);}assert.ok(c.validAt>=p.observedAt);}
});
test('26 imagery assets match source metadata and preserve day-level time precision',()=>{
 const manifest=JSON.parse(readFileSync('public/data/imagery.json','utf8'));
 assert.equal(manifest.frames.length,26);
 for(const frame of manifest.frames){const bytes=readFileSync(`public${frame.url}`);assert.equal(bytes.subarray(1,4).toString(),'PNG');assert.equal(bytes.readUInt32BE(16),768);assert.equal(bytes.readUInt32BE(20),768);assert.equal(createHash('sha256').update(bytes).digest('hex'),frame.sha256);assert.equal(frame.acquiredAt,null);assert.equal(frame.timePrecision,'day');assert.equal(frame.crs,'EPSG:3857');assert.ok(new URL(frame.sourceUrl).searchParams.get('TIME')===frame.date);}
});

test('each volcano has its own truthful window and Krakatau begins on 5 September',()=>{
 for(const v of catalog.volcanoes){const event=catalog.events.find(e=>e.volcanoId===v.id)!;const list=editions(catalog,v.id,event.id);assert.equal(v.window.start,list[0].issuedAt);assert.equal(v.window.end,list.at(-1)!.issuedAt);assert.equal(v.window.basis,['262000','263300'].includes(v.id)?'event':'archive');}
 const first=editions(catalog,'262000')[0];assert.equal(first.number,'2026/174');assert.equal(first.issuedAt,Date.parse('2026-09-05T06:30:00Z'));assert.equal(first.components.length,8);assert.equal(first.components[0].coordinates.length,6);assert.equal(first.components[1].coordinates.length,6);
 assert.deepEqual(first.components[1].coordinates[0],[105.816667,-6.366667]);
});

test('Semeru historical episode is separate and preserves unavailable/no-ash forecast statements',()=>{
 const list=editions(catalog,'263300','263300-2025-11');assert.equal(list.length,30);assert.ok(list.every(p=>new Date(p.issuedAt).getUTCFullYear()===2025));
 const first=list[0];assert.equal(first.number,'2025/1317');assert.equal(first.components[0].upper,540);assert.equal(first.leadStates['6'].status,'not-available');assert.equal(first.leadStates['6'].validAt,Date.parse('2025-11-19T15:20:00Z'));
 const noAsh=list.find(p=>p.number==='2025/1324')!;assert.equal(noAsh.leadStates['18'].status,'no-ash-expected');assert.ok(!noAsh.components.some(c=>c.leadHours===18));
 assert.ok(editions(catalog,'263300','263300-2026-09').every(p=>new Date(p.issuedAt).getUTCFullYear()===2026));
});
