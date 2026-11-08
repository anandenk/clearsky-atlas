import {test,expect} from '@playwright/test';
import {landscapeHeight} from '../../src/frontend/landscape';
test('analytical scale preserves zero and missing values',()=>{expect(landscapeHeight(0)).toBe(0);expect(landscapeHeight(null)).toBeNull();expect(landscapeHeight(100)).toBe(900);});
test('live landscape grows, reverses, and preserves map and selected address',async({page})=>{
 test.setTimeout(60000);const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));await page.setViewportSize({width:1440,height:960});await page.goto('/');
 await page.getByLabel('Search a California address').focus();await page.getByRole('button',{name:'Oakland',exact:true}).click();await page.getByRole('button',{name:/Confirm this address/}).click();
 const map=page.locator('.atlas-map');await expect(map).toHaveAttribute('data-pitch',/58/,{timeout:15000});await expect(map).toHaveAttribute('data-metric','pm');const instance=await map.getAttribute('data-instance'),center=await map.getAttribute('data-center');
 await page.getByRole('button',{name:'Data Landscape',exact:true}).click();await page.waitForTimeout(350);
 const progress=Number(await map.getAttribute('data-landscape-progress'));expect(progress).toBeGreaterThan(0);expect(progress).toBeLessThan(1);
 await page.screenshot({path:'artifacts/landscape/intermediate.png'});
 await page.getByRole('button',{name:'City',exact:true}).click();await expect(map).toHaveAttribute('data-landscape-progress','0');
 await page.getByRole('button',{name:'Data Landscape',exact:true}).click();await expect(map).toHaveAttribute('data-landscape-progress','1');await expect.poll(async()=>Number(await map.getAttribute('data-landscape-rendered'))).toBeGreaterThan(0);
 await expect(page.locator('.analytical-height')).toContainText('Not building height');await expect(page.locator('.place-pin')).toHaveCount(1);await expect(map).toHaveAttribute('data-instance',instance!);await expect(map).toHaveAttribute('data-center',center!);
 await page.screenshot({path:'artifacts/landscape/oakland.png'});
 await page.getByRole('button',{name:'Infrastructure',exact:true}).click();await expect(map).toHaveAttribute('data-landscape-progress','0');await page.getByRole('button',{name:'Environment',exact:true}).click();await expect(map).toHaveAttribute('data-landscape-progress','1');
 await page.emulateMedia({reducedMotion:'reduce'});await page.setViewportSize({width:375,height:812});await page.getByRole('button',{name:'City',exact:true}).click();await expect(map).toHaveAttribute('data-landscape-progress','0');await page.getByRole('button',{name:'Data Landscape',exact:true}).click();await expect(map).toHaveAttribute('data-landscape-progress','1');await page.screenshot({path:'artifacts/landscape/mobile.png'});expect(errors).toEqual([]);
});

test('composition stays flat while the saved analytical preference returns for scalar measures',async({page})=>{
 test.setTimeout(60000);await page.emulateMedia({reducedMotion:'reduce'});await page.goto('/');await page.getByLabel('Search a California address').focus();await page.getByRole('button',{name:'Oakland',exact:true}).click();await page.getByRole('button',{name:/Confirm this address/}).click();
 const map=page.locator('.atlas-map');await expect(map).toHaveAttribute('data-metric','pm');await page.getByRole('button',{name:'Data Landscape',exact:true}).click();await expect(map).toHaveAttribute('data-landscape-progress','1');
 await page.getByRole('button',{name:'Community',exact:true}).click();await expect(map).toHaveAttribute('data-metric','poverty');await page.getByRole('combobox',{name:'Choose a measure'}).selectOption('age');await expect(map).toHaveAttribute('data-landscape-progress','0');await expect(page.getByRole('button',{name:'Data Landscape',exact:true})).toBeDisabled();
 await page.getByRole('button',{name:'Environment',exact:true}).click();await expect(map).toHaveAttribute('data-metric','pm');await expect(map).toHaveAttribute('data-landscape-progress','1');
});
