import { test } from 'node:test';
import assert from 'node:assert/strict';
import { MINUTE, nearest, playbackTimes, selectAdvisories, overlaps, formatTime, type Advisory } from '../apps/web/src/lib/time.ts';
const record: Advisory={id:'one',productId:'p',revision:0,componentId:'low',kind:'observed',observedAt:0,issuedAt:0,lower:0,upper:150,coordinates:[]};
test('nearest selection reports future frames, prefers earlier ties, and expires outside tolerance',()=>{
 const records=[{time:0},{time:10*MINUTE}];
 assert.equal(nearest(records,5*MINUTE)?.record.time,0);
 assert.equal(nearest(records,8*MINUTE)?.offsetMinutes,2);
 assert.equal(nearest(records,18*MINUTE),null);
 assert.equal(nearest(records,0)?.method,'exact');
});
test('playback includes off-grid events and bounds once',()=>assert.deepEqual(playbackTimes(0,20*MINUTE,[7*MINUTE,7*MINUTE,-1]),[0,7*MINUTE,10*MINUTE,20*MINUTE]));
test('observed display windows expire and newer observations supersede older ones',()=>{
 assert.equal(selectAdvisories([record],59*MINUTE).length,1);
 assert.equal(selectAdvisories([record],60*MINUTE).length,0);
 const newer={...record,id:'two',productId:'p2',observedAt:30*MINUTE,issuedAt:30*MINUTE};
 assert.deepEqual(selectAdvisories([record,newer],40*MINUTE).map(r=>r.id),['two']);
});
test('revisions preserve multiple altitude components sharing a source',()=>{
 const low={...record,id:'low-r1',revision:1};
 const high={...low,id:'high-r1',componentId:'high',lower:200,upper:300};
 assert.deepEqual(selectAdvisories([record,low,high],0).map(r=>r.id),['low-r1','high-r1']);
});
test('forecasts appear only at their target and use the latest eligible issue',()=>{
 const old={...record,id:'old',kind:'forecast' as const,forecastValidAt:37*MINUTE};
 const latest={...old,id:'latest',productId:'new',issuedAt:10*MINUTE};
 const future={...old,id:'future',productId:'future',issuedAt:40*MINUTE};
 assert.deepEqual(selectAdvisories([old,latest,future],37*MINUTE).map(r=>r.id),['latest']);
 assert.equal(selectAdvisories([old],38*MINUTE).length,0);
});
test('timezone formatting crosses dates without changing the instant',()=>{
 const time=Date.parse('2026-09-04T18:00:00Z');
 assert.match(formatTime(time,'WIB',true),/05 Sept?, 01:00/);
 assert.match(formatTime(time,'UTC',true),/04 Sept?, 18:00/);
});
test('altitude bands exclude non-overlapping components',()=>{
 assert.equal(overlaps(200,300,'0-150'),false);
 assert.equal(overlaps(0,150,'200-300'),false);
 assert.equal(overlaps(200,300,'all'),true);
 assert.equal(overlaps(200,300,'300-500'),false);
});
