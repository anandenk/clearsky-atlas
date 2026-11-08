// Manual live-data probe: node tests/ui/performance-probe.mjs <artifact-label>
// Private React/MapLibre inspection stays in this test, never in application code.
import { chromium } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';
const label=process.argv[2]??'sample';
await mkdir('artifacts/responsiveness',{recursive:true});
const browser=await chromium.launch({channel:'chrome'});
const page=await browser.newPage({viewport:{width:1440,height:960}});
const cdp=await page.context().newCDPSession(page);
if(process.env.TRACE)await cdp.send('Tracing.start',{categories:'devtools.timeline,v8,blink.user_timing,gpu,cc',transferMode:'ReturnAsStream'});
const mark=async name=>{console.log('stage',name);await page.evaluate(name=>{performance.mark(name);(window.probe.stages??=[]).push({name,time:performance.now()});},name);};
const errors=[];page.on('pageerror',e=>errors.push(e.message));
await page.addInitScript(()=>{
 window.probe={frames:[],long:[],events:[],start:performance.now()};
 new PerformanceObserver(l=>window.probe.long.push(...l.getEntries().map(e=>({start:e.startTime,duration:e.duration})))).observe({type:'longtask',buffered:true});
 new PerformanceObserver(l=>window.probe.events.push(...l.getEntries().map(e=>({name:e.name,duration:e.duration,delay:e.processingStart-e.startTime})))).observe({type:'event',durationThreshold:16,buffered:true});
 let last=performance.now();function frame(t){window.probe.frames.push({start:t,duration:t-last});last=t;requestAnimationFrame(frame);}requestAnimationFrame(frame);
});
try{
await page.goto(process.env.PLAYWRIGHT_BASE_URL ?? 'http://127.0.0.1:3000');
await page.waitForSelector('.atlas-map[data-metric="pm"]',{timeout:60000});
await page.evaluate(()=>{
 const el=document.querySelector('.atlas-map');let f=el[Object.keys(el).find(k=>k.startsWith('__reactFiber'))];
 while(f){let h=f.memoizedState;while(h){if(h.memoizedState?.current?.getZoom)window.probeMap=h.memoizedState.current;h=h.next;}f=f.return;}
 if(!window.probeMap)throw Error('Map inspection failed');
 const m=window.probeMap;window.probe.ready=performance.now();window.probe.calls=[];
 for(const name of ['setPaintProperty','queryRenderedFeatures']){const orig=m[name];m[name]=function(...args){const t=performance.now();const r=orig.apply(this,args);window.probe.calls.push({name,property:args[1],start:t,duration:performance.now()-t});return r;};}
 const orig=m.style._updateLayer;m.style._updateLayer=function(...args){window.probe.calls.push({name:'relayout',start:performance.now(),duration:0});return orig.apply(this,args);};
});
await mark('enter-landscape');await page.getByRole('button',{name:'Data Landscape',exact:true}).click();await page.waitForTimeout(2000);
if(process.env.FREEZE)await page.evaluate(()=>{const m=window.probeMap,orig=m.setPaintProperty;m.setPaintProperty=function(...args){if(args[1]==='fill-extrusion-height')return this;return orig.apply(this,args);};});
for(let run=0;run<2;run++){
 await mark('in-'+run);
 await page.evaluate(()=>{window.probe.navigationStart=performance.now();window.probeMap.flyTo({center:[-118.24,34.05],zoom:12,pitch:50,bearing:25,duration:4000,essential:true});});
 await page.waitForTimeout(4500);
 await mark('pan-'+run);await page.mouse.move(950,450);await page.mouse.down();await page.mouse.move(800,500,{steps:20});await page.mouse.up();
 await mark('reverse-'+run);await page.getByRole('button',{name:'City',exact:true}).click();await page.waitForTimeout(250);await page.getByRole('button',{name:'Data Landscape',exact:true}).click();
 await page.waitForTimeout(1500);
 await mark('out-'+run);await page.evaluate(()=>{window.probeMap.flyTo({center:[-120,37.3],zoom:5.2,bearing:0,pitch:50,duration:4000,essential:true});});await page.waitForTimeout(4500);
}
await mark('screenshot');await page.screenshot({path:`artifacts/responsiveness/${label}.png`});
const data=await page.evaluate(()=>({...window.probe,memory:performance.memory?{used:performance.memory.usedJSHeapSize,total:performance.memory.totalJSHeapSize}:null,resources:performance.getEntriesByType('resource').filter(e=>e.name.includes('/api/map')).map(e=>({duration:e.duration,transfer:e.transferSize,decoded:e.decodedBodySize})),camera:{zoom:window.probeMap.getZoom(),pitch:window.probeMap.getPitch()}}));
const percentile=(a,p)=>a.sort((a,b)=>a-b)[Math.floor((a.length-1)*p)]??0;
const frames=data.frames.filter(e=>e.start>data.ready).map(e=>e.duration);
const summary={label,readyMs:data.ready,frames:{p50:percentile(frames,.5),p95:percentile(frames,.95),max:Math.max(...frames)},longTasks:data.long.length,longTaskMs:data.long.reduce((s,e)=>s+e.duration,0),calls:Object.fromEntries(['setPaintProperty','queryRenderedFeatures','relayout'].map(n=>[n,data.calls.filter(e=>e.name===n).length])),heightWrites:data.calls.filter(e=>e.property==='fill-extrusion-height').length,input:data.events,memory:data.memory,resources:data.resources,errors};
await writeFile(`artifacts/responsiveness/${label}.json`,JSON.stringify({summary,data},null,2));console.log(JSON.stringify({...summary,input:summary.input.filter(e=>e.name==='click')},null,2));
if(process.env.TRACE){const done=new Promise(r=>cdp.once('Tracing.tracingComplete',r));await cdp.send('Tracing.end');const {stream}=await done;let trace='';for(;;){const r=await cdp.send('IO.read',{handle:stream});trace+=r.data;if(r.eof)break;}await cdp.send('IO.close',{handle:stream});await writeFile(`artifacts/responsiveness/${label}-trace.json`,trace);}
}finally{await browser.close();}
