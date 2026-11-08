import {test,expect} from '@playwright/test';
test('confirmed Oakland arrives among physical buildings and retains its selection',async({page})=>{
 test.setTimeout(90000);const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
 await page.setViewportSize({width:1440,height:960});await page.goto('/');
 await page.getByLabel('Search a California address').focus();await page.getByRole('button',{name:'Oakland',exact:true}).click();
 await page.getByRole('button',{name:/Confirm this address/}).click();
 const map=page.locator('.atlas-map');await expect.poll(async()=>Number(await map.getAttribute('data-buildings-rendered'))).toBeGreaterThan(50);
 expect(Number(await map.getAttribute('data-pitch'))).toBeCloseTo(58);const instance=await map.getAttribute('data-instance');
 await page.screenshot({path:'artifacts/clearsky-m1/oakland.png'});
 await page.getByRole('button',{name:'Zoom out',exact:true}).click();await page.waitForTimeout(700);
 await expect(page.locator('.place-pin')).toHaveCount(1);await expect(map).toHaveAttribute('data-instance',instance!);
 await page.screenshot({path:'artifacts/clearsky-m1/oakland-zoom.png'});expect(errors).toEqual([]);
});

test('city keyboard rotation and reduced-motion mobile preserve the confirmed place',async({page})=>{
 test.setTimeout(90000);await page.emulateMedia({reducedMotion:'reduce'});
 await page.setViewportSize({width:375,height:812});await page.goto('/');
 await page.getByLabel('Search a California address').focus();await page.getByRole('button',{name:'Oakland',exact:true}).click();await page.getByRole('button',{name:/Confirm this address/}).click();
 const map=page.locator('.atlas-map');await expect.poll(async()=>Number(await map.getAttribute('data-buildings-rendered'))).toBeGreaterThan(0);
 await expect(map).toHaveAttribute('data-arrival-duration','0');
 const canvas=page.locator('.maplibregl-canvas');await canvas.focus();const before=await map.getAttribute('data-bearing');await page.keyboard.press('Shift+ArrowRight');
 await expect.poll(()=>map.getAttribute('data-bearing')).not.toBe(before);
 const center=await map.getAttribute('data-center');await page.keyboard.press('ArrowRight');await expect.poll(()=>map.getAttribute('data-center')).not.toBe(center);
 await expect(page.locator('.place-pin')).toHaveCount(1);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 await page.screenshot({path:'artifacts/clearsky-m1/mobile-keyboard.png'});
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
