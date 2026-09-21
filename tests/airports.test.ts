import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
test('nine airport locations retain official sources including Atung Bungsu',()=>{
 const data=JSON.parse(readFileSync('public/data/airports.json','utf8'));
 assert.equal(data.airports.length,9);assert.deepEqual(data.unresolved,[]);
 const atung=data.airports.find((p:any)=>p.id==='atungbusu');
 assert.equal(atung.name,'Atung Bungsu');assert.equal(atung.sourceUrl,'https://hubud.kemenhub.go.id/bandara/302');assert.equal(atung.retrievedAt,'2026-09-21');
 assert.deepEqual(atung.coordinates,[103+22/60+43.452/3600,-(4+1/60+29.354/3600)]);
 const report=JSON.parse(readFileSync('public/data/chronology.json','utf8')).airports.find((p:any)=>p.id==='atungbusu');
 assert.equal(report.reopenedAt,null,'Resolving identity must not invent a reopening');
 for(const p of data.airports){assert.equal(createHash('sha256').update(readFileSync(p.sourcePath)).digest('hex'),p.sha256);assert.equal(new URL(p.sourceUrl).hostname,'hubud.kemenhub.go.id');assert.ok(p.coordinates[0]>103&&p.coordinates[0]<109);assert.ok(p.coordinates[1]>-8&&p.coordinates[1]<-4);assert.ok(p.sourceCoordinates.includes('LS'));}
 assert.deepEqual(data.airports.find((p:any)=>p.id==='halim').coordinates,[106+53/60+30/3600,-(6+16/60+7/3600)]);
});
