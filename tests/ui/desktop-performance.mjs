// Focused, repeatable local workload probe. No renderer objects leave evaluate.
import {chromium} from '@playwright/test';
import {mkdir,writeFile} from 'node:fs/promises';
const label=process.argv[2] || 'sample';
const browser=await chromium.launch({channel:'chrome'});
try {
 const page=await browser.newPage({viewport:{width:1440,height:960}}), errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:3001');
 await page.waitForSelector('.atlas-map[data-metric="pm"]',{timeout:45000});
 await page.evaluate(()=>{
  const el=document.querySelector('.atlas-map');let f=el[Object.keys(el).find(k=>k.startsWith('__reactFiber'))];
  while(f){let h=f.memoizedState;while(h){if(h.memoizedState?.current?.getZoom)window.testMap=h.memoizedState.current;h=h.next;}f=f.return;}
  window.work={queries:0,queryMs:0,submissions:[],frames:[]};const m=window.testMap;
  const query=m.queryRenderedFeatures;m.queryRenderedFeatures=function(...args){const t=performance.now();const r=query.apply(this,args);window.work.queries++;window.work.queryMs+=performance.now()-t;return r;};
  const source=m.getSource('facilities'),set=source.setData;source.setData=function(data,...args){window.work.submissions.push(data.features.length);return set.call(this,data,...args);};
 });
 await page.getByRole('button',{name:'Data Landscape',exact:true}).click();
 await page.waitForTimeout(1800);
 const hover=await page.evaluate(async()=>{
  const m=window.testMap,before=window.work.queries,t=performance.now();
  // High-frequency input burst: only the newest location in a frame is visible.
  for(let i=0;i<120;i++)m.fire('mousemove',{point:{x:700+i%90,y:400+i%60}});
  await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));
  return {events:120,queries:window.work.queries-before,queryMs:window.work.queryMs,elapsedMs:performance.now()-t};
 });
 await page.getByRole('button',{name:'Infrastructure',exact:true}).click();
 await page.waitForFunction(()=>document.querySelector('.inventory-status')?.textContent.includes('24,865'),{timeout:90000});
 await page.waitForTimeout(1200);
 await page.getByRole('button',{name:'Environment',exact:true}).click();
 await page.waitForSelector('.atlas-map[data-metric="pm"]');
 await page.getByRole('button',{name:'Infrastructure',exact:true}).click();
 await page.waitForTimeout(1800);
 const result=await page.evaluate(()=>({submissions:window.work.submissions,tooltip:!!document.querySelector('.map-tooltip'),inventory:document.querySelector('.inventory-status')?.textContent}));
 await mkdir('artifacts/performance-pass',{recursive:true});
 await page.screenshot({path:`artifacts/performance-pass/${label}.png`});
 const report={label,hover,...result,errors};await writeFile(`artifacts/performance-pass/${label}.json`,JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
}finally{await browser.close();}
