import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import Ajv from 'ajv';
import addFormats from 'ajv-formats';
const read=(path:string)=>JSON.parse(readFileSync(path,'utf8'));
const ajv=new Ajv({allErrors:true});addFormats(ajv);
const root='public/data/events/anak-krakatau-2026-09/';
const event=read(root+'event.json'),timeline=read(root+'timeline.json');
for(const [name,data] of [['event',event],['timeline',timeline]] as const)test(`${name} satisfies its JSON Schema`,()=>{
 const validate=ajv.compile(read(`schemas/${name}.schema.json`));
 assert.ok(validate(data),JSON.stringify(validate.errors));
 const invalid:any=structuredClone(data);if(name==='event')invalid.start='yesterday';else invalid.events[0].sourceId=42;
 assert.equal(validate(invalid),false);
});
test('event assets, timeline references and clock boundaries resolve',()=>{
 assert.equal(timeline.eventId,event.id);
 assert.ok(Date.parse(event.start)<=Date.parse(event.preferredStart)&&Date.parse(event.preferredStart)<=Date.parse(event.end));
 for(const path of Object.values(event.assets) as string[])assert.ok(existsSync(`public${path}`));
 const ids=new Set(timeline.sources.map((s:any)=>s.id));
 assert.equal(new Set(timeline.events.map((e:any)=>e.id)).size,timeline.events.length);
 for(const marker of timeline.events){assert.ok(ids.has(marker.sourceId));assert.ok(Date.parse(marker.time)>=Date.parse(event.start)&&Date.parse(marker.time)<=Date.parse(event.end));}
 assert.deepEqual(timeline.events,read('public/data/chronology.json').events);
});
test('event GeoJSON preserves complete editions, geometry, altitude and empty assessments',()=>{
 const geo=read(`public${event.assets.advisories}`),catalog=read('public/data/catalog.json');
 const products=catalog.products.filter((p:any)=>p.volcanoId===event.volcanoId&&p.issuedAt>=Date.parse(event.start)&&p.issuedAt<=Date.parse(event.end));
 assert.ok(products.length>0);assert.equal(geo.type,'FeatureCollection');assert.equal(geo.eventId,event.id);
 assert.deepEqual(geo.editions,products.map(({components,...edition}:any)=>edition));
 const components=products.flatMap((p:any)=>p.components.map((c:any)=>({p,c})));
 assert.equal(geo.features.length,components.length);
 assert.equal(new Set(geo.features.map((f:any)=>f.id)).size,components.length);
 for(const {p,c} of components){
  const feature=geo.features.find((f:any)=>f.id===c.id);
  assert.equal(feature.type,'Feature');assert.equal(feature.geometry.type,'Polygon');
  assert.deepEqual(feature.geometry.coordinates,[c.coordinates]);
  assert.deepEqual(c.coordinates[0],c.coordinates.at(-1));assert.ok(c.coordinates.length>=4);
  assert.equal(feature.properties.editionId,p.id);assert.equal(feature.properties.sourceUrl,p.sourceUrl);
  for(const key of ['lower','upper','validAt','kind','leadHours'])assert.equal(feature.properties[key],c[key]);
  for(const key of ['revision','supersededBy','issuedAt','observedAt'])assert.equal(feature.properties[key],p[key]);
 }
});
test('airport-status contract preserves sourced uncertainty and allows absent reports',()=>{
 const status=read(`public${event.assets.airportStatus}`),original=read('public/data/chronology.json');
 const validate=ajv.compile<any>(read('schemas/airport-status.schema.json'));
 assert.ok(validate(status),JSON.stringify(validate.errors));
 assert.equal(status.eventId,event.id);
 for(const key of ['airports','closureReport','sources','limitations'])assert.deepEqual(status[key],original[key]);
 const sources=new Set(status.sources.map((s:any)=>s.id));
 assert.ok(sources.has(status.closureReport.sourceId));
 assert.equal(status.closureReport.actualStart,null);
 assert.ok(Date.parse(status.closureReport.closedBy)<Date.parse(status.closureReport.plannedUntil));
 for(const airport of status.airports)if(airport.reopeningSourceId)assert.ok(sources.has(airport.reopeningSourceId));
 assert.ok(validate({...status,airports:[],closureReport:null,sources:[]}));
 assert.equal(validate({...status,closureReport:{...status.closureReport,closedBy:'unknown'}}),false);
});
test('observation export preserves report precision and avoids assigning airport-wide reports to points',()=>{
 const observations=read(`public${event.assets.observations}`);
 assert.equal(observations.type,'FeatureCollection');assert.equal(observations.eventId,event.id);
 assert.equal(observations.features.length,timeline.events.length);
 for(const marker of timeline.events){
  const feature=observations.features.find((f:any)=>f.id===marker.id);
  assert.equal(feature.type,'Feature');assert.equal(feature.geometry,null);
  for(const [key,value] of Object.entries(marker))assert.equal(feature.properties[key],value);
  const source=timeline.sources.find((s:any)=>s.id===marker.sourceId);
  assert.equal(feature.properties.sourceUrl,source.url);
  assert.equal(feature.properties.sourcePublishedDate,source.publishedDate);
 }
 const ground=observations.features.filter((f:any)=>f.properties.kind==='ground-observation');
 assert.equal(ground.length,2);assert.ok(ground.every((f:any)=>f.geometry===null));
});
