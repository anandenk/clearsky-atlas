import {test,expect} from '@playwright/test';
import {previewCatalog} from '../../src/frontend/provider';

test('reused overlay never flashes its previous geometry while worker data changes', async ({page}) => {
  test.setTimeout(60000);
  await page.setViewportSize({width:1440,height:960});
  // Test-only blank basemap makes any incorrectly exposed shading measurable.
  await page.route('**/ui/basemap.json*', route => route.fulfill({json:{version:8,sources:{},layers:[{id:'background',type:'background',paint:{'background-color':'#ffffff'}}]}}));
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
  const fadeOut:number[]=[];
  for(let i=0;i<5;i++) fadeOut.push((await pixel())[0]);
  expect(fadeOut.some(v=>v>180 && v<250)).toBe(true);
  await expect(map).toHaveAttribute('data-metric','ozone');
  await page.waitForTimeout(500);
  expect(await pixel()).toEqual([255,255,255]);
  console.log('Measured fade-in/out red channel:',fadeIn,fadeOut);
});

test('overlay loading status stays compact at desktop and mobile widths', async ({page}) => {
  await page.route('**/ui/basemap.json*', route => route.fulfill({json:{version:8,sources:{},layers:[{id:'background',type:'background',paint:{'background-color':'#ffffff'}}]}}));
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
  for(const width of [1440,375,320]) {
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
