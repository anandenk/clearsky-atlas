import {chromium} from '@playwright/test';
import {writeFile} from 'node:fs/promises';
const browser=await chromium.launch({channel:'chrome'});
try{
const page=await browser.newPage({viewport:{width:1440,height:960}});
const session=await page.context().newCDPSession(page);
await session.send('Profiler.enable');
await page.goto(process.env.PLAYWRIGHT_BASE_URL ?? 'http://127.0.0.1:3000');await page.waitForSelector('.atlas-map[data-metric="pm"]');
await session.send('Profiler.start');
await page.getByRole('button',{name:'Data Landscape',exact:true}).click();await page.waitForTimeout(2500);
const {profile}=await session.send('Profiler.stop');
await writeFile('artifacts/responsiveness/first-click-cpu.json',JSON.stringify(profile));
const totals=new Map();for(let i=0;i<profile.samples.length;i++)totals.set(profile.samples[i],(totals.get(profile.samples[i])??0)+profile.timeDeltas[i]);
console.log(profile.nodes.map(n=>({ms:(totals.get(n.id)??0)/1000,...n.callFrame})).sort((a,b)=>b.ms-a.ms).slice(0,30));
}finally{await browser.close();}
