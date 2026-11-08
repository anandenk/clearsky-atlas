// Bounded local two-map sample; not a device-independent performance guarantee.
import {chromium} from '@playwright/test';
import {mkdir,writeFile} from 'node:fs/promises';
const b=await chromium.launch({channel:'chrome'});
try{
 const p=await b.newPage({viewport:{width:1440,height:960}}),errors=[];p.on('pageerror',e=>errors.push(e.message));
 await p.addInitScript(()=>{window.probe={frames:[],long:[],events:[]};let last=performance.now();function f(t){window.probe.frames.push({t,dt:t-last});last=t;requestAnimationFrame(f);}requestAnimationFrame(f);new PerformanceObserver(l=>window.probe.long.push(...l.getEntries().map(e=>({t:e.startTime,dt:e.duration})))).observe({type:'longtask',buffered:true});new PerformanceObserver(l=>window.probe.events.push(...l.getEntries().filter(e=>e.name==='click').map(e=>({dt:e.duration,delay:e.processingStart-e.startTime})))).observe({type:'event',durationThreshold:16,buffered:true});});
 await p.goto('http://127.0.0.1:3001');await p.waitForSelector('.atlas-map[data-metric="pm"]');
 for(const city of ['Oakland','Fresno']){await p.getByLabel('Search a California address').focus();await p.getByRole('button',{name:city,exact:true}).click();await p.getByRole('button',{name:/Confirm this address/}).click();}
 await p.getByRole('button',{name:'Compare geography',exact:true}).click();await p.waitForSelector('.comparison-map-stage .atlas-map[data-metric="pm"]');
 await p.getByRole('button',{name:'Data Landscape',exact:true}).click();await p.waitForTimeout(2500);
 await p.evaluate(()=>{window.probe.start=performance.now();window.maps=[...document.querySelectorAll('.atlas-map')].map(el=>{let f=el[Object.keys(el).find(k=>k.startsWith('__reactFiber'))];while(f){let h=f.memoizedState;while(h){if(h.memoizedState?.current?.getZoom)return h.memoizedState.current;h=h.next;}f=f.return;}});});
 for(let i=0;i<2;i++){await p.evaluate(()=>{window.maps[0].easeTo({zoom:7,pitch:50,bearing:30,duration:2000,essential:true});});await p.waitForTimeout(2500);await p.evaluate(()=>{window.maps[1].easeTo({zoom:13,pitch:50,bearing:0,duration:2000,essential:true});});await p.waitForTimeout(2500);}
 const data=await p.evaluate(()=>({...window.probe,memory:performance.memory?.usedJSHeapSize,mapResources:performance.getEntriesByType('resource').filter(e=>e.name.includes('/api/map')).map(e=>({bytes:e.decodedBodySize,duration:e.duration})),cameras:window.maps.map(m=>({zoom:m.getZoom(),pitch:m.getPitch(),bearing:m.getBearing(),center:m.getCenter().toArray()}))}));
 const frames=data.frames.filter(x=>x.t>=data.start).map(x=>x.dt).sort((a,b)=>a-b);
 const summary={warmFrames:{p50:frames[Math.floor(frames.length*.5)],p95:frames[Math.floor(frames.length*.95)],max:Math.max(...frames)},warmLongTasks:data.long.filter(x=>x.t>=data.start),clicks:data.events,jsHeapSnapshot:data.memory,mapResources:data.mapResources,cameras:data.cameras,errors};
 await mkdir('artifacts/geography',{recursive:true});await writeFile('artifacts/geography/performance.json',JSON.stringify({summary,data},null,2));console.log(JSON.stringify(summary,null,2));
}finally{await b.close();}
