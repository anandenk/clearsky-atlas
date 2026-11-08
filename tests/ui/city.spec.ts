import {test,expect,type Page} from '@playwright/test';
// The accepted Overture view suppresses the preliminary OSM building layer.
async function physicalBuildings(page: Page) {
 await page.waitForFunction(()=>{
  const el=document.querySelector('.atlas-map') as any;
  let f=el?.[Object.keys(el).find(k=>k.startsWith('__reactFiber'))!];
  while(f){let h=f.memoizedState;while(h){const m=h.memoizedState?.current;
   if(m?.getZoom){const layer='overture-buildings-3d';return !!m.getLayer(layer) && m.getPaintProperty(layer,'fill-extrusion-opacity')>0 && m.queryRenderedFeatures({layers:[layer]}).length>50;}
   h=h.next;}f=f.return;}return false;
 },undefined,{timeout:45000});
}
test('confirmed Oakland arrives among physical buildings and retains its selection',async({page})=>{
 test.setTimeout(90000);const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
 await page.setViewportSize({width:1440,height:960});await page.goto('/');
 await page.getByLabel('Search a California address').focus();await page.getByRole('button',{name:'Oakland',exact:true}).click();
 await page.getByRole('button',{name:/Confirm this address/}).click();
 const map=page.locator('.atlas-map');await physicalBuildings(page);
 await expect.poll(async()=>Number(await map.getAttribute('data-pitch'))).toBeCloseTo(58);const instance=await map.getAttribute('data-instance');
 await page.screenshot({path:'artifacts/clearsky-m1/oakland.png'});
 await page.getByRole('button',{name:'Zoom out',exact:true}).click();await page.waitForTimeout(700);
 await expect(page.locator('.place-pin')).toHaveCount(1);await expect(map).toHaveAttribute('data-instance',instance!);
 await page.screenshot({path:'artifacts/clearsky-m1/oakland-zoom.png'});expect(errors).toEqual([]);
});

test('city keyboard rotation and reduced-motion preserve the confirmed place',async({page})=>{
 test.setTimeout(90000);await page.emulateMedia({reducedMotion:'reduce'});
 await page.setViewportSize({width:process.env.ATLAS_DESKTOP_ONLY === '1' ? 1440 : 375,height:960});await page.goto('/');
 await page.getByLabel('Search a California address').focus();await page.getByRole('button',{name:'Oakland',exact:true}).click();await page.getByRole('button',{name:/Confirm this address/}).click();
 const map=page.locator('.atlas-map');await physicalBuildings(page);
 await expect(map).toHaveAttribute('data-arrival-duration','0');
 const canvas=page.locator('.maplibregl-canvas');await canvas.focus();const before=await map.getAttribute('data-bearing');await page.keyboard.press('Shift+ArrowRight');
 await expect.poll(()=>map.getAttribute('data-bearing')).not.toBe(before);
 const center=await map.getAttribute('data-center');await page.keyboard.press('ArrowRight');await expect.poll(()=>map.getAttribute('data-center')).not.toBe(center);
 await expect(page.locator('.place-pin')).toHaveCount(1);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 await page.screenshot({path:'artifacts/clearsky-m1/reduced-motion-keyboard.png'});
});

test('arrival has intermediate frames and can be interrupted without losing selection',async({page})=>{
 test.setTimeout(60000);await page.goto('/');const map=page.locator('.atlas-map');await expect(map).toHaveAttribute('data-ready','true');
 await page.getByLabel('Search a California address').focus();await page.getByRole('button',{name:'Oakland',exact:true}).click();
 await page.getByRole('button',{name:/Confirm this address/}).click();
 const samples=await page.evaluate(async()=>{const values:{t:number,pitch:number}[]=[];const start=performance.now();await new Promise<void>(resolve=>{function sample(){const el=document.querySelector<HTMLElement>('.atlas-map');const camera=JSON.parse(el?.dataset.camera||'{}');values.push({t:performance.now()-start,pitch:camera.pitch??0});if(performance.now()-start<2100)requestAnimationFrame(sample);else resolve();}sample();});return values;});
 expect(samples.some(s=>s.pitch>1&&s.pitch<57)).toBe(true);expect(samples.at(-1)!.pitch).toBeCloseTo(58);
 await test.info().attach('arrival-frame-samples',{body:JSON.stringify(samples),contentType:'application/json'});
 await page.getByRole('button',{name:'Show all places'}).click();await page.waitForTimeout(150);await page.locator('.maplibregl-canvas').focus();await page.keyboard.press('ArrowLeft');await expect(page.locator('.place-pin')).toHaveCount(1);
});

test('basemap failure remains visible after tract data succeeds',async({page})=>{
 await page.route('https://tiles.openfreemap.org/planet',r=>r.abort());await page.goto('/');
 await expect(page.locator('.map-error')).toContainText('map source could not load',{timeout:30000});
 await page.waitForTimeout(1500);await expect(page.locator('.map-error')).toBeVisible();
});
