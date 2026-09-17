import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import type {Catalog} from '../apps/web/src/data/types.ts';
import {replayAdvisories,advisoryInstants} from '../apps/web/src/lib/replayAdvisories.ts';
const catalog:Catalog=JSON.parse(readFileSync('public/data/catalog.json','utf8'));
const products=catalog.products.filter(p=>p.volcanoId==='262000');
const first=products[0];
for(const status of ['no-ash-expected','not-available'] as const)test(`newer ${status} forecast supersedes older geometry`,()=>{
 const newer=catalog.products.find(p=>p.volcanoId==='263300'&&Object.entries(p.leadStates).some(([lead,s])=>Number(lead)>0&&s.status===status))!;
 const [lead,state]=Object.entries(newer.leadStates).find(([lead,s])=>Number(lead)>0&&s.status===status)!;
 const older={...newer,id:'older-cycle',productId:'older-cycle',issuedAt:newer.issuedAt-3600000,leadStates:{[lead]:{validAt:state.validAt,status:'geometry' as const}},components:[{...first.components[0],leadHours:Number(lead),validAt:state.validAt,kind:'forecast' as const}]};
 const selected=replayAdvisories([older,newer],state.validAt).find(a=>a.mode==='forecast')!;
 assert.equal(selected.product.id,newer.id);assert.equal(selected.status,status);assert.deepEqual(selected.components,[]);
 assert.ok(advisoryInstants([newer]).includes(state.validAt));
});
test('real initial polygons wait for issue time and expire without becoming continuous ash',()=>{
 assert.equal(replayAdvisories(products,first.issuedAt-1).length,0);
 const atIssue=replayAdvisories(products,first.issuedAt);assert.equal(atIssue.length,1);assert.equal(atIssue[0].ageMinutes,20);assert.equal(atIssue[0].components.length,2);
 assert.equal(replayAdvisories(products,first.observedAt+3600000).filter(a=>a.mode==='initial').length,0);
});
test('forecasts retain all altitude components at the exact target only',()=>{
 const target=first.components.find(c=>c.leadHours===6)!.validAt;
 const selection=replayAdvisories([first],target);assert.equal(selection.length,1);assert.equal(selection[0].mode,'forecast');assert.equal(selection[0].components.length,2);
 assert.equal(replayAdvisories([first],target+1).length,0);
 const cycles=replayAdvisories(products,target).find(a=>a.mode==='forecast')!;
 assert.ok(cycles.product.issuedAt<=target);
 assert.ok(cycles.components.every(c=>c.validAt===target));
});
test('corrections are resolved as of the clock and estimated positions stay estimated',()=>{
 const family=products.filter(p=>p.number==='2026/215');
 const corrected=replayAdvisories(family,family[1].issuedAt).find(a=>a.mode==='initial')!;
 assert.equal(corrected.product.id,family[1].id);
 const estimated=catalog.products.find(p=>p.estimated&&p.observedAt<=p.issuedAt&&p.issuedAt<p.observedAt+3600000)!;
 assert.ok(replayAdvisories([estimated],estimated.issuedAt)[0].components.every(c=>c.kind==='estimated'));
 const times=advisoryInstants([first]);assert.ok(times.includes(first.issuedAt));assert.ok(times.includes(first.observedAt+3600000));assert.ok(times.includes(first.components.at(-1)!.validAt));
});
