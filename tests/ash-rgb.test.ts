import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
const hash=(path:string)=>createHash('sha256').update(readFileSync(path)).digest('hex');
test('Ash RGB coverage accounts for each processed clock slot exactly once',()=>{
 const archive=JSON.parse(readFileSync('public/data/ash-rgb.json','utf8'));
 const start=Date.parse(archive.start),end=Date.parse(archive.end);
 const expected=(end-start)/600000+1;
 assert.equal(archive.expectedClockSlots,expected);
 const records=[...archive.frames.map((f:any)=>f.time),...archive.missingSourceScans.map((f:any)=>Date.parse(f.time)),...archive.failedScans.map((f:any)=>Date.parse(f.time))];
 assert.equal(new Set(records).size,records.length,'frames, source gaps and failures must not overlap');
 assert.equal(archive.processedClockSlots,records.length);
 for(const time of records){assert.ok(time>=start&&time<=end);assert.equal((time-start)%600000,0);}
 assert.equal(archive.complete,records.length===expected&&archive.failedScans.length===0);
 for(const gap of archive.missingSourceScans){assert.ok(gap.reason);assert.equal(new URL(gap.sourceUrl).hostname,'noaa-himawari9.s3.amazonaws.com');}
});
test('Ash RGB archive has four traceable calibrated band inputs per scan and complete cropped coverage',()=>{
 const archive=JSON.parse(readFileSync('public/data/ash-rgb.json','utf8'));
 assert.ok(archive.frames.length>=3);assert.equal(archive.crs,'EPSG:3857');
 assert.equal(archive.recipe.red,'(BT15 - BT13 + 4) / 6');assert.equal(archive.recipe.green,'(BT14 - BT11 + 4) / 9');assert.equal(archive.recipe.blue,'(BT13 - 243) / 60');
 for(const [i,f] of archive.frames.entries()){
  assert.equal(f.time,Date.parse(f.sourceTime));assert.ok(f.time%600000===0);if(i)assert.ok(f.time>archive.frames[i-1].time);assert.equal(f.validPixelFraction,1);
  assert.equal(hash(`public${f.url}`),f.sha256);const bytes=readFileSync(`public${f.url}`);assert.equal(bytes.readUInt32BE(16),640);assert.equal(bytes.readUInt32BE(20),564);
  assert.deepEqual(f.inputs.map((s:any)=>s.band).sort(),['B11','B13','B14','B15']);
  for(const input of f.inputs){assert.equal(input.time,f.sourceTime);assert.match(input.sha256,/^[a-f0-9]{64}$/);assert.match(input.path,/^data\/raw\/ahi-ash\/HS_H09_[\w.]+\.DAT\.bz2$/);assert.ok(input.bytes>0);assert.equal(new URL(input.url).hostname,'noaa-himawari9.s3.amazonaws.com');}
  for(const stats of Object.values(f.temperatureRange) as any[]){assert.ok(stats.minKelvin>150&&stats.minKelvin<330);assert.ok(stats.maxKelvin>250&&stats.maxKelvin<350);}
 }
});
