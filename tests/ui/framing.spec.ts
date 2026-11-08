import {test,expect} from '@playwright/test';
test('Together frames both pins clear of panels and map controls',async({page})=>{
 test.setTimeout(60000);await page.emulateMedia({reducedMotion:'reduce'});await page.setViewportSize({width:1440,height:960});await page.goto('/');await expect(page.locator('.atlas-map')).toHaveAttribute('data-metric','pm',{timeout:30000});
 for(const city of ['Oakland','Fresno']){await page.getByLabel('Search a California address').focus();await page.getByRole('button',{name:city,exact:true}).click();await page.getByRole('button',{name:/Confirm this address/}).click();}
 for(const width of (process.env.ATLAS_DESKTOP_ONLY === '1' ? [1440] : [1440,768,375,320])){
 await page.setViewportSize({width,height:960});await page.getByRole('button',{name:'Show all places'}).click();await page.waitForTimeout(500);
 const pins=await page.locator('.place-pin').all();expect(pins.length).toBe(2);
 const obstacles=await page.locator('.comparison-canvas,.map-key,.view-switch,.maplibregl-ctrl-group,.place-ribbon').evaluateAll(els=>els.map(e=>{const b=e.getBoundingClientRect();return {x:b.x,y:b.y,right:b.right,bottom:b.bottom};}));
 for(const pin of pins){const b=(await pin.boundingBox())!;expect(b.x).toBeGreaterThan(10);expect(b.x+b.width).toBeLessThan(width-10);for(const o of obstacles)expect(b.x+b.width<=o.x||b.x>=o.right||b.y+b.height<=o.y||b.y>=o.bottom,JSON.stringify({width,pin:b,obstacle:o})).toBe(true);}
 await page.screenshot({path:`artifacts/framing/together-${width}.png`});
 }
});
