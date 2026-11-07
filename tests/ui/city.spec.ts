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
