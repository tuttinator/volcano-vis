import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
const data=JSON.parse(readFileSync('public/data/directory.json','utf8'));
test('directory preserves the complete dated official table with source checksum',()=>{
 assert.equal(data.inputSha256,createHash('sha256').update(readFileSync('data/raw/magma-volcano-types.html')).digest('hex'));
 assert.equal(data.volcanoes.length,127);assert.equal(new Set(data.volcanoes.map((v:any)=>v.id)).size,127);
 for(const [type,count] of [['A',76],['B',30],['C',21]])assert.equal(data.volcanoes.filter((v:any)=>v.classification===type).length,count);
 for(const v of data.volcanoes){assert.ok(v.name.trim());assert.ok(v.coordinates[0]>94&&v.coordinates[0]<142);assert.ok(v.coordinates[1]>-11&&v.coordinates[1]<7);}
 assert.equal(data.volcanoes.find((v:any)=>v.name==='Sinabung').classification,'A');
 assert.equal(data.volcanoes.find((v:any)=>v.name==='Merbabu').classification,'B');
 assert.equal(data.volcanoes.filter((v:any)=>v.name==='Sumbing').length,2);
 assert.equal(data.volcanoes.filter((v:any)=>v.advisoryId).length,6);
});
