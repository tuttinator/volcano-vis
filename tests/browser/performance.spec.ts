import {test,expect} from '@playwright/test';
import {readFileSync} from 'node:fs';
const archive=JSON.parse(readFileSync('public/data/himawari.json','utf8'));
test('200 paired clock changes settles on the final selected scans',async({page},info)=>{
 test.setTimeout(60000);
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
 let requested=0,failed=0;
 page.on('request',r=>{if(r.url().includes('/data/himawari/'))requested++;});
 page.on('requestfailed',r=>{if(r.url().includes('/data/himawari/'))failed++;});
 await page.goto(`/?view=replay&time=${archive.frames[0].time}&replayPair=1&replayComparison=times&replayOffset=60`);
 const maps=page.locator('.replay-panes .real-map');
 await expect(maps.nth(0)).toHaveAttribute('data-raster-url',archive.frames[0].url);
 await page.evaluate(()=>{const state={longTasks:[] as number[],start:performance.now()};(window as any).scrubBenchmark=state;new PerformanceObserver(list=>state.longTasks.push(...list.getEntries().map(e=>e.duration))).observe({type:'longtask'});});
 const latencies:number[]=[];
 const targets=archive.frames.filter((f:any)=>archive.frames.some((next:any)=>next.time===f.time+3600000)).slice(1,201);
 for(const frame of targets){
  const before=Date.now();await page.getByLabel('Event time').fill(String(frame.time));
  await page.evaluate(()=>new Promise<void>(resolve=>requestAnimationFrame(()=>resolve())));
  latencies.push(Date.now()-before);
 }
 const last=targets.at(-1)!;const settlingStarted=Date.now();
 await expect(maps.nth(0)).toHaveAttribute('data-raster-url',last.url);
 await expect(maps.nth(1)).toHaveAttribute('data-raster-url',archive.frames.find((f:any)=>f.time===last.time+3600000).url);
 const metrics=await page.evaluate(()=>{const s=(window as any).scrubBenchmark;return {elapsedMs:performance.now()-s.start,longTaskCount:s.longTasks.length,longTaskTotalMs:s.longTasks.reduce((sum:number,n:number)=>sum+n,0),maxLongTaskMs:Math.max(0,...s.longTasks)};});
 const sorted=latencies.sort((a,b)=>a-b);
 const report={...metrics,changes:targets.length,interactionMedianMs:sorted[Math.floor(sorted.length/2)],interactionP95Ms:sorted[Math.floor(sorted.length*.95)],finalPairSettleMs:Date.now()-settlingStarted,rasterRequests:requested,abortedOrFailedRequests:failed,notes:'Local Chromium, production assets, two panes, fixed one-hour offset. Interaction timing includes Playwright transport; this is not a frame-rate measurement. Aborted requests include intentional cancellation during scrubbing.'};
 await info.attach('scrubbing-metrics.json',{body:JSON.stringify(report,null,2),contentType:'application/json'});
 console.log(JSON.stringify(report));
 expect(errors).toEqual([]);
});
