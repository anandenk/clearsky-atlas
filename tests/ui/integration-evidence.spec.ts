import {test,expect,type Page} from '@playwright/test';
import fs from 'node:fs';
import {containingTracts} from '../../src/spatial';

async function oakland(page: Page) {
 await page.getByLabel('Search a California address').focus();
 await page.getByRole('button',{name:'Oakland',exact:true}).click();
 await page.getByRole('button',{name:/Confirm this address/}).click();
}
async function evidence(page: Page) {
 const button=page.getByRole('button',{name:'Open evidence',exact:true});
 if(await button.isVisible())await button.click();
}

test('verified same-tract addresses retain original coordinates and direct removal recovers the reference',async({page,request})=>{
 test.setTimeout(90000);await page.setViewportSize({width:1440,height:960});await page.emulateMedia({reducedMotion:'reduce'});
 const original=(await (await request.get('/api/demo')).json())[0];
 const match=JSON.parse(fs.readFileSync('data/raw/geocode-oakland-central-near.json','utf8')).result.addressMatches[0];
 const coordinate:[number,number]=[match.coordinates.x,match.coordinates.y];
 const tract=match.geographies['Census Tracts'][0].GEOID;
 // Reuse a retained Census match only after checking full lookup geometry.
 const exact=JSON.parse(fs.readFileSync('data/lookup.json','utf8')).features;
 expect(containingTracts(coordinate,exact).map(f=>f.properties?.id)).toEqual([tract]);
 expect(tract).toBe(original.tractId);expect(coordinate).not.toEqual(original.coordinate);
 const nearby={...original,label:match.matchedAddress,coordinate,censusTract:tract,cached:true};
 await page.route('**/api/geocode',r=>r.fulfill({json:{candidates:[nearby]}}));
 await page.goto('/');await oakland(page);
 await page.getByLabel('Search a California address').fill(match.matchedAddress);
 await page.getByRole('button',{name:'Search',exact:true}).click();
 await page.getByRole('button',{name:/Confirm this address/}).click();await evidence(page);
 await page.getByRole('button',{name:'Explore Fine particulate matter',exact:true}).click();
 await expect(page.locator('.reading-value')).toHaveText(['8.33','8.33']);
 await expect(page.locator('.compass-finding')).toContainText('share one census tract');
 await expect(page.locator('.place-pin')).toHaveCount(2);
 const requests:string[]=[];page.on('request',r=>{if(r.url().includes('/api/facilities?')&&r.url().includes('near='))requests.push(r.url());});
 await page.getByRole('button',{name:'Infrastructure',exact:true}).click();
 await expect.poll(()=>new Set(requests.map(u=>new URL(u).searchParams.get('near'))).size).toBe(2);
 expect(new Set(requests.map(u=>new URL(u).searchParams.get('near')))).toEqual(new Set([coordinate.join(','),original.coordinate.join(',')]));
 await page.getByRole('button',{name:'Environment',exact:true}).click();
 // Direct removal replaces the former reference/replacement menu by user decision.
 await page.locator('.place-chip').first().getByRole('button',{name:/^Remove /}).click();
 await expect(page.locator('.reading-delta')).toHaveText('Reference');
 await page.getByLabel('Search a California address').focus();
 await page.getByRole('button',{name:'Fresno',exact:true}).click();await page.getByRole('button',{name:/Confirm this address/}).click();
 await expect(page.locator('.reading-value')).toHaveText(['8.33','12.48']);
 await expect(page.locator('.reading-delta').last()).toHaveText('+4.15 vs A');
 await page.locator('.place-chip').first().getByRole('button',{name:/^Remove /}).click();
 await expect(page.locator('.place-pin')).toHaveCount(1);await expect(page.locator('.reading-delta')).toHaveText('Reference');
 await page.screenshot({path:'artifacts/integration/same-tract-reference.png'});
});

test('facility version mismatch withholds that category while independent healthcare remains usable',async({page})=>{
 test.setTimeout(90000);await page.setViewportSize({width:1440,height:960});await page.emulateMedia({reducedMotion:'reduce'});
 await page.route('**/api/facilities?category=schools**',async r=>{
  const response=await r.fetch();const data=await response.json();
  await r.fulfill({json:{...data,datasetVersion:'test-only-incompatible-version'}});
 });
 await page.goto('/');await oakland(page);await evidence(page);
 await page.getByRole('button',{name:'Infrastructure',exact:true}).click();
 await expect(page.locator('.facilities-content .error')).toContainText('Source version mismatch');
 await expect(page.locator('.facilities-content .facility-list > button')).toHaveCount(6);
 await expect(page.locator('.facilities-content .facility-list')).toContainText('Healthcare');
 await expect(page.locator('.inventory-error')).toContainText('Facility inventory contract mismatch');
 await expect(page.locator('.preview-status')).toHaveCount(0);
 await page.screenshot({path:'artifacts/integration/facility-version-mismatch.png'});
});

test('returning to live after a failed request clears synthetic geography and its display state',async({page})=>{
 test.setTimeout(90000);await page.setViewportSize({width:1440,height:960});await page.emulateMedia({reducedMotion:'reduce'});
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('/');await expect(page.locator('.atlas-map')).toHaveAttribute('data-provider','live',{timeout:30000});
 await page.getByRole('button',{name:'Atlas menu',exact:true}).click();
 await page.locator(".atlas-menu-advanced > summary").click();
 await page.getByRole('button',{name:'Explore synthetic preview',exact:true}).click();
 await page.getByRole('button',{name:'Add a synthetic example',exact:true}).click();
 await expect(page.locator('.atlas-map')).toHaveAttribute('data-provider','preview');
 await expect(page.locator('.atlas-map')).toHaveAttribute('data-tracts-rendered','true');
 const before=await page.locator('.atlas-map').getAttribute('data-instance');
 await page.route('**/api/map?**',r=>r.fulfill({status:503,json:{error:'Test-only live map failure'}}));
 await page.getByRole('button',{name:'Return to live',exact:true}).click();
 await expect(page.locator('.preview-status')).toHaveCount(0);
 await expect(page.locator('.map-error')).toContainText('Tract layer unavailable');
 await expect(page.locator('.atlas-map')).not.toHaveAttribute('data-instance',before!);
 await expect(page.locator('.atlas-map')).toHaveAttribute('data-tracts-rendered','false');
 await expect(page.locator('.atlas-map')).not.toHaveAttribute('data-provider','preview');
 await expect(page.locator('.place-pin')).toHaveCount(0);
 await expect(page.locator('.map-key-title')).toContainText('Loading evidence');
 expect(errors).toEqual([]);
 await page.screenshot({path:'artifacts/integration/failed-live-return.png'});
});

test('raster fallback clears the removed Overture status',async({page})=>{
 test.setTimeout(90000);await page.setViewportSize({width:1440,height:960});await page.emulateMedia({reducedMotion:'reduce'});
 await page.goto('/');await oakland(page);
 await expect(page.locator('.building-status')).toContainText('Overture · statewide buildings + parts',{timeout:45000});
 await page.getByRole('button',{name:'Atlas menu',exact:true}).click();
 await page.locator(".atlas-menu-advanced > summary").click();
 await page.getByRole('button',{name:'Use fallback raster basemap',exact:true}).click();
 await expect(page.locator('.building-status')).toHaveCount(0);
 await expect(page.locator('.atlas-map')).toHaveAttribute('data-provider','live',{timeout:30000});
 await expect(page.locator('.place-pin')).toHaveCount(1);
 await page.screenshot({path:'artifacts/integration/raster-status.png'});
});

test('controlled tiny gaps stay nonzero and a same-key definition mismatch suppresses rendered comparisons',async({page})=>{
 test.setTimeout(90000);await page.setViewportSize({width:1440,height:960});await page.emulateMedia({reducedMotion:'reduce'});
 let incompatible=false;
 await page.route('**/api/tracts/*?version=*',async r=>{
  const response=await r.fetch(),data=await response.json();
  const fresno=!new URL(r.request().url()).pathname.endsWith('06001403402');
  // Test-only response mutation; no cached source bytes or product values change.
  const observations=data.observations.map((o:any)=>o.indicatorId==='pm'
   ? {...o,rawValue:fresno?8.334:8.33,...(incompatible&&fresno?{definition:o.definition+' Test-only incompatible definition.'}:{})}:o);
  await r.fulfill({json:{...data,observations}});
 });
 const selectPair=async(reverse=false)=>{
  await page.goto('/');
  for(const name of reverse?['Fresno','Oakland']:['Oakland','Fresno']){
   await page.getByLabel('Search a California address').focus();await page.getByRole('button',{name,exact:true}).click();
   await page.getByRole('button',{name:/Confirm this address/}).click();
  }
  await evidence(page);
  await page.getByRole('button',{name:'Explore Fine particulate matter',exact:true}).click();
 };
 await selectPair();await expect(page.locator('.compass-finding')).toContainText('0.004');
 await expect(page.locator('.reading-delta').nth(1)).toHaveText('+0.004 vs A');
 await selectPair(true);
 await expect(page.locator('.reading-delta').nth(1)).toHaveText('-0.004 vs A');
 incompatible=true;await selectPair();
 await expect(page.locator('.compass-finding')).toContainText('Matching evidence is needed');
 await expect(page.locator('.reading-delta').nth(1)).toHaveText('Difference unavailable');
 await page.screenshot({path:'artifacts/integration/same-key-incompatible.png'});
});
