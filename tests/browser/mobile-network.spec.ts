import {test,expect} from '@playwright/test';
import {readFileSync} from 'node:fs';
const archive=JSON.parse(readFileSync('public/data/himawari.json','utf8'));

test('paired replay clears obsolete images and settles after scrubbing on a throttled mobile viewport',async({page},info)=>{
 test.setTimeout(90000);
 await page.setViewportSize({width:390,height:844});
 const errors:string[]=[];page.on('pageerror',error=>errors.push(error.message));
 await page.goto(`/?view=replay&time=${archive.frames[0].time}&replayPair=1&replayComparison=times&replayOffset=60`);
 const maps=page.locator('.replay-panes .real-map');
 await expect(maps.nth(0)).toHaveAttribute('data-raster-url',archive.frames[0].url);
 await expect(maps.nth(1)).toHaveAttribute('data-raster-url',archive.frames.find((f:any)=>f.time===archive.frames[0].time+3600000).url);
 const cdp=await page.context().newCDPSession(page);
 await cdp.send('Network.enable');
 await cdp.send('Network.setCacheDisabled',{cacheDisabled:true});
 await cdp.send('Network.emulateNetworkConditions',{offline:false,latency:150,downloadThroughput:1500000/8,uploadThroughput:750000/8,connectionType:'cellular3g'});
 await cdp.send('Emulation.setCPUThrottlingRate',{rate:4});
 let bytes=0;cdp.on('Network.loadingFinished',e=>{bytes+=e.encodedDataLength;});
 const targets=archive.frames.filter((f:any)=>archive.frames.some((other:any)=>other.time===f.time+3600000)).slice(100,120);
 const latencies:number[]=[];
 for(const target of targets){
  const before=Date.now();
  await page.getByLabel('Event time').fill(String(target.time));
  await expect(page.getByLabel('Event time')).toHaveValue(String(target.time));
  latencies.push(Date.now()-before);
 }
 const last=targets.at(-1)!;
 const finalSource=archive.frames.find((f:any)=>f.time===last.time+3600000);
 // During loading a map may be empty or already show its selected scan, never another time.
 for(const [i,url] of [last.url,finalSource.url].entries()){
  const displayed=await maps.nth(i).getAttribute('data-raster-url');
  expect(displayed===null||displayed===''||displayed===url).toBe(true);
 }
 const settleStart=Date.now();
 await expect(maps.nth(0)).toHaveAttribute('data-raster-url',last.url,{timeout:30000});
 await expect(maps.nth(1)).toHaveAttribute('data-raster-url',finalSource.url,{timeout:30000});
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 const sorted=[...latencies].sort((a,b)=>a-b);
 const report={viewport:'390×844',latencyMs:150,downloadBitsPerSecond:1500000,cpuSlowdown:4,cacheDisabled:true,changes:targets.length,inputMedianMs:sorted[Math.floor(sorted.length/2)],inputP95Ms:sorted[Math.floor(sorted.length*.95)],finalPairSettleMs:Date.now()-settleStart,completedRequestBytes:bytes,jsErrors:errors.length,scope:'Warm application shell; uncached raster scrubbing. Desktop Chromium emulation, not physical mobile hardware or cold-start measurement.'};
 await info.attach('mobile-network-metrics.json',{body:JSON.stringify(report,null,2),contentType:'application/json'});
 console.log(JSON.stringify(report));
 expect(errors).toEqual([]);
 await cdp.send('Emulation.setCPUThrottlingRate',{rate:1});
});
