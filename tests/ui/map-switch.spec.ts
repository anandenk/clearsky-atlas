import {test,expect} from '@playwright/test';
import {previewCatalog} from '../../src/frontend/provider';

// These pixel probes isolate thematic buffers on a deliberately white basemap.
// The independently verified California context dimmer is not part of that fixture.
test.beforeEach(async ({page}) => {
  await page.route('**/ui/california-context.geojson', r => r.fulfill({
    json:{type:'FeatureCollection',features:[]},
  }));
});

test('reused overlay never flashes its previous geometry while worker data changes', async ({page}) => {
  test.setTimeout(60000);
  await page.setViewportSize({width:1440,height:960});
  // Test-only blank basemap makes any incorrectly exposed shading measurable.
  await page.route('**/ui/clearsky-city.json*', route => route.fulfill({json:{version:8,sources:{},layers:[{id:'background',type:'background',paint:{'background-color':'#ffffff'}}]}}));
  const feature = (coordinates: number[][]) => ({type:'Feature',properties:{id:'test-tract',value:10,percentile:100},geometry:{type:'Polygon',coordinates:[coordinates]}});
  await page.route('**/api/map?**', route => {
    const metric = new URL(route.request().url()).searchParams.get('indicator');
    const features = metric === 'pm' ? [feature([[-130,30],[-110,30],[-110,45],[-130,45],[-130,30]])] : metric === 'ozone' ? [] : Array.from({length:16000},(_,i)=>{
      const x = -90 + (i%100)*.001, y=30+Math.floor(i/100)*.001;
      return feature([[x,y],[x+.0005,y],[x+.0005,y+.0005],[x,y+.0005],[x,y]]);
    });
    return route.fulfill({json:{type:'FeatureCollection',features}});
  });
  await page.route('**/api/indicators', route => route.fulfill({json:{indicators:previewCatalog()}}));
  await page.goto('/');
  const map = page.locator('.atlas-map');
  await expect(map).toHaveAttribute('data-metric','pm');
  await expect(map).toHaveAttribute('data-tracts-rendered','true');
  await page.waitForTimeout(1600);
  const pixel = async () => {
    const png = await page.screenshot({clip:{x:800,y:350,width:1,height:1}});
    return page.evaluate(async bytes=>{
      const bitmap=await createImageBitmap(new Blob([new Uint8Array(bytes)],{type:'image/png'}));
      const canvas=document.createElement('canvas');canvas.width=canvas.height=1;
      const ctx=canvas.getContext('2d')!;ctx.drawImage(bitmap,0,0);bitmap.close();
      return Array.from(ctx.getImageData(0,0,1,1).data).slice(0,3);
    },Array.from(png));
  };
  expect((await pixel())[0]).toBeLessThan(230);
  await page.getByRole('button',{name:'Ozone',exact:true}).click();
  await expect(map).toHaveAttribute('data-metric','ozone');
  await page.waitForTimeout(600);
  expect(await pixel()).toEqual([255,255,255]);
  const cdp=await page.context().newCDPSession(page);
  await cdp.send('Emulation.setCPUThrottlingRate',{rate:4});
  await page.getByRole('button',{name:'Cleanup sites',exact:true}).click();
  // The buffer reused here previously contained the full-screen PM polygon.
  // New test geometry is offscreen, so even one tinted sample is a stale flash.
  for(let i=0;i<12;i++) { const rgb=await pixel(); expect(Math.min(...rgb)).toBeGreaterThan(245); }
  await expect(map).toHaveAttribute('data-metric','cleanup');
  for(const name of ['Fine particles','Diesel','Traffic','Ozone'])
    await page.getByRole('button',{name,exact:true}).click();
  await expect(map).toHaveAttribute('data-metric','ozone');
  await page.waitForTimeout(600);
  expect(await pixel()).toEqual([255,255,255]);
  await cdp.send('Emulation.setCPUThrottlingRate',{rate:1});
  await page.getByRole('button',{name:'Fine particles',exact:true}).click();
  await expect(map).toHaveAttribute('data-metric','pm');
  const fadeIn:number[]=[];
  for(let i=0;i<8;i++) fadeIn.push((await pixel())[0]);
  expect(fadeIn.some(v=>v>180 && v<245)).toBe(true);
  await page.waitForTimeout(500);
  await page.getByRole('button',{name:'Ozone',exact:true}).click();
  await expect(map).toHaveAttribute('data-metric','ozone');
  const fadeOut:number[]=[];
  for(let i=0;i<12;i++) fadeOut.push((await pixel())[0]);
  console.log('Replacement-to-empty samples:',fadeOut);
  expect(fadeOut.some(v=>v>180 && v<250)).toBe(true);
  await expect(map).toHaveAttribute('data-metric','ozone');
  await page.waitForTimeout(500);
  expect(await pixel()).toEqual([255,255,255]);
  console.log('Measured fade-in/out red channel:',fadeIn,fadeOut);
});

test('overlay loading status stays compact at desktop and mobile widths', async ({page}) => {
  await page.route('**/ui/clearsky-city.json*', route => route.fulfill({json:{version:8,sources:{},layers:[{id:'background',type:'background',paint:{'background-color':'#ffffff'}}]}}));
  await page.route('**/api/indicators', route => route.fulfill({json:{indicators:previewCatalog()}}));
  let release!: () => void;
  const pending = new Promise<void>(resolve => {release=resolve;});
  await page.route('**/api/map?**',async route=>{
    await pending;
    await route.fulfill({json:{type:'FeatureCollection',features:[]}}).catch(()=>{});
  });
  await page.setViewportSize({width:1440,height:960});
  await page.goto('/');
  const status=page.locator('.map-update-status');
  await expect(status).toBeVisible();
  for(const width of (process.env.ATLAS_DESKTOP_ONLY === '1' ? [1440] : [1440,375,320])) {
    await page.setViewportSize({width,height:960});
    const box=await status.boundingBox();
    expect(box!.height).toBeLessThan(70);
    expect(box!.width).toBeLessThan(360);
    expect(box!.x).toBeGreaterThanOrEqual(0);
    expect(box!.x+box!.width).toBeLessThanOrEqual(width);
    await expect(status).toHaveCSS('pointer-events','none');
    await page.screenshot({path:`artifacts/overlay-motion/loading-status-${width}.png`});
  }
  release();
  await expect(status).toHaveCount(0);
});

test('holds the last overlay during delayed, superseded and failed requests, then blends without a blank frame', async ({page}) => {
  await page.setViewportSize({width:1440,height:960});
  await page.route('**/ui/clearsky-city.json*', r=>r.fulfill({json:{version:8,sources:{},layers:[{id:'background',type:'background',paint:{'background-color':'#ffffff'}}]}}));
  await page.route('**/api/indicators', r=>r.fulfill({json:{indicators:previewCatalog()}}));
  let release!:()=>void;
  const pending=new Promise<void>(r=>{release=r;});
  await page.route('**/api/map?**',async r=>{
    const id=new URL(r.request().url()).searchParams.get('indicator');
    if(id==='ozone'||id==='diesel')await pending;
    if(id==='cleanup')return r.fulfill({status:503,json:{error:'Test-only failure'}});
    await r.fulfill({json:{type:'FeatureCollection',features:[{type:'Feature',properties:{id:'test-tract',value:10,percentile:id==='pm'?100:30},geometry:{type:'Polygon',coordinates:[[[-130,30],[-110,30],[-110,45],[-130,45],[-130,30]]]}}]}}).catch(()=>{});
  });
  await page.goto('/');
  const map=page.locator('.atlas-map');
  await expect(map).toHaveAttribute('data-metric','pm');await page.waitForTimeout(1600);
  const pixel=async()=>{
    const png=await page.screenshot({clip:{x:800,y:350,width:1,height:1}});
    return page.evaluate(async bytes=>{
      const bitmap=await createImageBitmap(new Blob([new Uint8Array(bytes)],{type:'image/png'}));
      const c=document.createElement('canvas');c.width=c.height=1;const ctx=c.getContext('2d')!;
      ctx.drawImage(bitmap,0,0);bitmap.close();return ctx.getImageData(0,0,1,1).data[0];
    },Array.from(png));
  };
  const original=await pixel();expect(original).toBeLessThan(230);
  await page.getByRole('button',{name:'Ozone',exact:true}).click();
  await page.waitForTimeout(650);
  expect(Math.abs(await pixel()-original)).toBeLessThan(3);
  await page.getByRole('button',{name:'Diesel',exact:true}).click();
  await page.waitForTimeout(500);
  expect(Math.abs(await pixel()-original)).toBeLessThan(3);
  await page.screenshot({path:'artifacts/overlay-hold/held.png'});
  release();await expect(map).toHaveAttribute('data-metric','diesel');
  const frames:number[]=[];for(let i=0;i<10;i++)frames.push(await pixel());
  expect(Math.max(...frames)).toBeLessThan(250);
  expect(frames.some(v=>v>original+3 && v<frames.at(-1)!-2)).toBe(true);
  await page.waitForTimeout(500);const final=await pixel();
  await page.getByRole('button',{name:'Cleanup sites',exact:true}).click();
  await expect(page.locator('.map-error')).toContainText('last loaded overlay is retained');
  expect(Math.abs(await pixel()-final)).toBeLessThan(3);
  console.log('Held red channel:',original,'replacement samples:',frames);
  await page.screenshot({path:'artifacts/overlay-hold/replaced.png'});
});

test('infrastructure waits for its inventory and retains markers until tract replacement is ready', async ({page})=>{
  test.setTimeout(45000);
  await page.setViewportSize({width:1440,height:960});
  await page.route('**/ui/clearsky-city.json*',r=>r.fulfill({json:{version:8,sources:{},layers:[{id:'background',type:'background',paint:{'background-color':'#ffffff'}}]}}));
  let releaseFacilities!:()=>void,releaseTracts!:()=>void,holdTracts=false;
  const facilitiesPending=new Promise<void>(r=>{releaseFacilities=r;});
  const tractsPending=new Promise<void>(r=>{releaseTracts=r;});
  await page.route('**/api/facilities?**',async r=>{await facilitiesPending;await r.continue().catch(()=>{});});
  await page.route('**/api/map?**',async r=>{
    if(holdTracts)await tractsPending;
    await r.continue().catch(()=>{});
  });
  await page.goto('/');
  await page.getByLabel('Search a California address').focus();
  await page.getByRole('button',{name:'Oakland',exact:true}).click();
  await page.getByRole('button',{name:/Confirm this address/}).click();
  const map=page.locator('.atlas-map');
  await expect(map).toHaveAttribute('data-tracts-rendered','true');await page.waitForTimeout(1700);
  await page.getByRole('button',{name:'Infrastructure',exact:true}).click();
  await page.waitForTimeout(1000);
  await expect(map).toHaveAttribute('data-tracts-rendered','true');
  await expect(page.locator('.map-update-status')).toContainText('infrastructure');
  releaseFacilities();
  await expect(page.locator('.map-update-status')).toHaveCount(0);
  await expect(map).toHaveAttribute('data-facility-hit',/"x"/);
  await page.waitForTimeout(700);
  // Explicit retry invalidates the resident cache, so this checks a real pending handoff.
  await page.getByRole('button',{name:'Atlas menu'}).click();
  await page.locator(".atlas-menu-advanced > summary").click();
  await page.getByRole('button',{name:'Retry map & evidence'}).click();
  await expect(page.locator('.map-update-status')).toHaveCount(0);
  holdTracts=true;
  await page.getByRole('button',{name:'Environment',exact:true}).click();
  await page.waitForTimeout(700);
  await expect(map).toHaveAttribute('data-facility-hit',/"x"/);
  await expect(page.locator('.map-update-status')).toBeVisible();
  await page.screenshot({path:'artifacts/overlay-hold/facilities-held.png'});
  releaseTracts();await expect(map).toHaveAttribute('data-metric','pm');
  await expect(page.locator('.map-update-status')).toHaveCount(0);
  await page.waitForTimeout(700);
  await expect(map).toHaveAttribute('data-facilities-rendered','0');
});
