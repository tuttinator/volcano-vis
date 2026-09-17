import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
test('eight airport locations retain official sources while Atungbusu remains unresolved',()=>{
 const data=JSON.parse(readFileSync('public/data/airports.json','utf8'));
 assert.equal(data.airports.length,8);assert.deepEqual(data.unresolved,['atungbusu']);
 for(const p of data.airports){assert.equal(createHash('sha256').update(readFileSync(p.sourcePath)).digest('hex'),p.sha256);assert.equal(new URL(p.sourceUrl).hostname,'hubud.kemenhub.go.id');assert.ok(p.coordinates[0]>103&&p.coordinates[0]<109);assert.ok(p.coordinates[1]>-8&&p.coordinates[1]<-4);assert.ok(p.sourceCoordinates.includes('LS'));}
 assert.deepEqual(data.airports.find((p:any)=>p.id==='halim').coordinates,[106+53/60+30/3600,-(6+16/60+7/3600)]);
});
