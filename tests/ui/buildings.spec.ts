import {test,expect} from '@playwright/test';
import {writeFileSync} from 'node:fs';
function inspectMap() {
  const el = document.querySelector('.atlas-map') as any;
  let fiber = el[Object.keys(el).find(key => key.startsWith('__reactFiber'))!];
  while (fiber) {
    let hook = fiber.memoizedState;
    while (hook) {
      if (hook.memoizedState?.current?.getZoom) return hook.memoizedState.current;
      hook = hook.next;
    }
    fiber = fiber.return;
  }
  throw Error('Map instance unavailable');
}


test('Overture fills Rancho pilot, replaces OSM, caches cells and honors flat/3D and failures',async({page})=>{
 test.setTimeout(90000);await page.setViewportSize({width:1440,height:960});await page.emulateMedia({reducedMotion:'reduce'});
 const errors:string[]=[],requests:string[]=[];page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>{if(r.url().includes('/api/buildings?'))requests.push(r.url());});
 await page.goto('/');const map=page.locator('.atlas-map');await expect(map).toHaveAttribute('data-metric','pm',{timeout:30000});
 await page.getByRole('button',{name:'City',exact:true}).click();
 await page.evaluate(`window.testMap = (${inspectMap.toString()})()`);
 await page.evaluate(()=>{(window as any).testMap.jumpTo({center:[-117.552,34.127],zoom:15.6,pitch:58,bearing:0});});
 await expect(page.locator('.building-status')).toContainText('Overture · Rancho Cucamonga pilot',{timeout:45000});
 const sample=await page.evaluate(async()=>{const m=(window as any).testMap;const data=await m.getSource('overture-buildings').getData();return {loaded:data.features.length,unknown:data.features.filter((f:any)=>f.properties.height===null).length,rendered:m.queryRenderedFeatures({layers:['overture-buildings-3d']}).length,oldOpacity:m.getPaintProperty('city-buildings','fill-extrusion-opacity'),newOpacity:m.getPaintProperty('overture-buildings-3d','fill-extrusion-opacity'),frame:document.querySelector('.atlas-map')?.getAttribute('data-metric')};});
 expect(sample.loaded).toBeGreaterThan(1000);expect(sample.rendered).toBeGreaterThan(500);expect(sample.unknown).toBeGreaterThan(0);expect(sample.oldOpacity).toBe(0);expect(sample.newOpacity).toBeGreaterThan(0);expect(sample.frame).toBe('pm');
 writeFileSync('artifacts/building-coverage/frontend-counts.json',JSON.stringify({...sample,requests:requests.length},null,2));
 await test.info().attach('building-render-counts',{body:JSON.stringify({...sample,requests:requests.length}),contentType:'application/json'});
 await page.screenshot({path:'artifacts/building-coverage/rancho-overture.png'});
 const count=requests.length;await page.getByRole('button',{name:'Data Landscape',exact:true}).click();await page.getByRole('button',{name:'Flat',exact:true}).click();
 await expect.poll(()=>page.evaluate(()=>(window as any).testMap.getPaintProperty('overture-buildings-3d','fill-extrusion-opacity'))).toBe(0);
 await page.getByRole('button',{name:'City',exact:true}).click();
 await page.evaluate(()=>{(window as any).testMap.jumpTo({center:[-117.552,34.127],zoom:15.6,pitch:58,bearing:0});});
 await expect(page.locator('.building-status')).toContainText('Overture · Rancho Cucamonga pilot');expect(requests.length).toBe(count);
 await page.route('**/api/buildings?**',r=>r.fulfill({status:503,json:{code:'buildings-unavailable',error:'Test source failure'}}));
 await page.evaluate(()=>{(window as any).testMap.jumpTo({center:[-122.27,37.81],zoom:15.6,pitch:58});});
 await expect(page.locator('.building-status')).toContainText('Overture unavailable');
 expect(await page.evaluate(()=>(window as any).testMap.getPaintProperty('city-buildings','fill-extrusion-opacity'))).toBeGreaterThan(0);
 await page.evaluate(()=>{(window as any).testMap.jumpTo({center:[-118.24,34.05],zoom:15.6,pitch:58});});
 await expect(page.locator('.building-status')).toContainText('outside the Overture pilot');expect(errors).toEqual([]);
});

function mapsForTest() {
  return [...document.querySelectorAll(".atlas-map")].map((el: any) => {
    let f = el[Object.keys(el).find((k) => k.startsWith("__reactFiber"))!];
    while (f) {
      let h = f.memoizedState;
      while (h) {
        if (h.memoizedState?.current?.getZoom) return h.memoizedState.current;
        h = h.next;
      }
      f = f.return;
    }
    throw Error("Map unavailable");
  });
}

test('linked maps keep Overture coverage separate for Oakland and outside-pilot Fresno',async({page})=>{
 test.setTimeout(60000);await page.emulateMedia({reducedMotion:'reduce'});await page.setViewportSize({width:1440,height:960});await page.goto('/');
 for(const name of ['Oakland','Fresno']){await page.getByLabel('Search a California address').focus();await page.getByRole('button',{name,exact:true}).click();await page.getByRole('button',{name:/Confirm this address/}).click();}
 await page.getByRole('button',{name:'Compare geography',exact:true}).click();
 const maps=page.locator('.atlas-map');await expect(maps).toHaveCount(2);for(const m of await maps.all())await expect(m).toHaveAttribute('data-metric','pm',{timeout:30000});
 await page.evaluate(`window.testMaps = (${mapsForTest.toString()})()`);
 await page.evaluate(()=>{(window as any).testMaps[0].jumpTo({zoom:15.6,pitch:50});});
 await expect(page.locator('.building-status')).toContainText('Left: Overture · Oakland pilot',{timeout:45000});
 await expect(page.locator('.building-status')).toContainText('Right: OpenStreetMap buildings · outside');
 expect(await page.evaluate(()=>(window as any).testMaps.map((m:any)=>m.getPaintProperty('overture-buildings-3d','fill-extrusion-opacity')))).toEqual([.7,0]);
 await page.getByRole('button',{name:'Data Landscape',exact:true}).click();
 await expect.poll(()=>page.evaluate(()=>(window as any).testMaps.map((m:any)=>m.getPaintProperty('overture-buildings-3d','fill-extrusion-opacity')))).toEqual([0,0]);
});
