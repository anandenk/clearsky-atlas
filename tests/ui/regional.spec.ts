import {test,expect} from '@playwright/test';
test('Flat stays flat while 3D adapts its shared scale to zoom',async({page})=>{
 test.setTimeout(60000);await page.emulateMedia({reducedMotion:'reduce'});await page.setViewportSize({width:1440,height:960});await page.goto('/');
 const map=page.locator('.atlas-map');await expect(map).toHaveAttribute('data-metric','pm');const views=page.getByRole('group',{name:'Visualization'});
 await views.getByRole('button',{name:'Data Landscape',exact:true}).click();await page.getByRole('button',{name:'Flat',exact:true}).click();await expect(map).toHaveAttribute('data-landscape-progress','0');await expect(page.locator('.map-key')).toContainText('Flat landscape');
 await page.getByRole('button',{name:'3D',exact:true}).click();await expect(map).toHaveAttribute('data-landscape-progress','1');const distant=Number(await map.getAttribute('data-height-scale'));expect(distant).toBeGreaterThan(50);await expect(page.locator('.map-key')).toContainText('Height exaggerated');await page.waitForTimeout(500);await page.screenshot({path:'artifacts/adaptive-landscape/statewide.png'});
 await page.getByLabel('Search a California address').focus();await page.getByRole('button',{name:'Oakland',exact:true}).click();await page.getByRole('button',{name:/Confirm this address/}).click();await expect(map).toHaveAttribute('data-height-scale','9');await expect(page.locator('.place-pin')).toHaveCount(1);await page.screenshot({path:'artifacts/adaptive-landscape/neighborhood.png'});
 await views.getByRole('button',{name:'Data Landscape',exact:true}).click();await page.getByRole('button',{name:'Flat',exact:true}).click();await expect(map).toHaveAttribute('data-landscape-progress','0');await expect(page.locator('.place-pin')).toHaveCount(1);
});
test('missing observations receive a separate patterned layer',async({page})=>{
 await page.route('**/api/map?**',r=>r.fulfill({json:{type:'FeatureCollection',features:[{type:'Feature',properties:{id:'null-test',value:null,percentile:null},geometry:{type:'Polygon',coordinates:[[[-125,32],[-114,32],[-114,43],[-125,43],[-125,32]]]}}]}}));await page.goto('/');await expect(page.locator('.atlas-map')).toHaveAttribute('data-metric','pm');await page.screenshot({path:'artifacts/regional/missing-fixture.png'});
});
