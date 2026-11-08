// Focused, repeatable local workload probe. No renderer objects leave evaluate.
import assert from 'node:assert/strict';
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
  const query=m.queryRenderedFeatures;m.queryRenderedFeatures=function(...args){const t=performance.now();const r=query.apply(this,args);window.work.lastPoint={x:args[0]?.x,y:args[0]?.y};window.work.queries++;window.work.queryMs+=performance.now()-t;return r;};
  const source=m.getSource('facilities'),set=source.setData;source.setData=function(data,...args){window.work.submissions.push(data.features.length);return set.call(this,data,...args);};
 });
 await page.getByRole('button',{name:'Data Landscape',exact:true}).click();
 await page.waitForTimeout(1800);
 const hover=await page.evaluate(async()=>{
  const m=window.testMap,before=window.work.queries,t=performance.now();
  // High-frequency input burst: only the newest location in a frame is visible.
  for(let i=0;i<120;i++)m.fire('mousemove',{point:{x:700+i%90,y:400+i%60}});
  await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));
  return {lastPoint:window.work.lastPoint,events:120,queries:window.work.queries-before,queryMs:window.work.queryMs,elapsedMs:performance.now()-t};
 });
 const cancellation=await page.evaluate(async()=>{
  const m=window.testMap,before=window.work.queries;
  m.fire('mousemove',{point:{x:850,y:420}});m.fire('mouseout');
  await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));
  return {queries:window.work.queries-before,tooltip:!!document.querySelector('.map-tooltip')};
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
 await page.getByRole('button',{name:/Healthcare Shown/}).click();
 await page.waitForFunction(()=>window.work.submissions.at(-1)===9946);
 await page.getByRole('button',{name:/Healthcare Hidden/}).click();
 await page.waitForFunction(()=>window.work.submissions.at(-1)===24865);
 await page.getByRole('button',{name:'Find a facility',exact:true}).click();
 await page.getByLabel('Facility name',{exact:true}).fill('hospital');
 await page.locator('.facility-list button').first().click();
 await page.getByRole('button',{name:'Show on map',exact:true}).click();
 await page.waitForFunction(()=>Math.abs(window.testMap.getZoom()-15.6)<.01);
 const interactions=await page.evaluate(()=>({pins:document.querySelectorAll('.place-pin').length,submissions:window.work.submissions.slice(-2)}));
 const report={label,hover,cancellation,...result,interactions,errors};
 if(process.env.CHECK){
  assert.equal(hover.queries,1);assert.deepEqual(hover.lastPoint,{x:729,y:459});
  assert.deepEqual(cancellation,{queries:0,tooltip:false});
  assert.deepEqual(result.submissions,[14919,24865]);
  assert.deepEqual(interactions,{pins:0,submissions:[9946,24865]});
  assert.deepEqual(errors,[]);
 }await writeFile(`artifacts/performance-pass/${label}.json`,JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
}finally{await browser.close();}
