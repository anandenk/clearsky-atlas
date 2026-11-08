import {test,expect} from '@playwright/test';
test('compact desktop evidence keeps the map visible and restores keyboard focus',async({page})=>{
 test.setTimeout(60000);await page.emulateMedia({reducedMotion:'reduce'});await page.setViewportSize({width:1440,height:960});await page.goto('/');
 await expect(page.locator('.atlas-map')).toHaveAttribute('data-metric','pm',{timeout:30000});
 await page.screenshot({path:'artifacts/map-first/opening.png'});
 await page.getByLabel('Search a California address').focus();await page.getByRole('button',{name:'Oakland',exact:true}).click();await page.getByRole('button',{name:/Confirm this address/}).click();
 const map=page.locator('.atlas-map');await expect(map).toHaveAttribute('data-metric','pm',{timeout:30000});
 const instance=await map.getAttribute('data-instance');await expect(page.getByRole('button',{name:'Open evidence',exact:true})).toBeVisible();
 await expect(page.getByRole('region',{name:'Place evidence'})).toHaveCount(0);
 await expect(page.locator('.evidence-peek')).toContainText('8.33');
 await page.screenshot({path:'artifacts/map-first/desktop.png'});
 await page.getByRole('button',{name:'Open evidence',exact:true}).click();
 const panel=page.getByRole('region',{name:'Place evidence'});await expect(panel).toBeVisible();
 await expect(page.getByRole('button',{name:'More map',exact:true})).toBeFocused();
 await expect(panel).toContainText('8.33');await expect(page.locator('.place-pin')).toHaveCount(1);
 await page.screenshot({path:'artifacts/map-first/evidence.png'});
 // Adding the second confirmed place opens comparison even after manual collapse.
 await page.getByRole('button',{name:'More map',exact:true}).click();
 await expect(page.locator('#evidence')).toHaveAttribute('aria-hidden','true');
 await page.getByLabel('Search a California address').focus();await page.getByRole('button',{name:'Fresno',exact:true}).click();await page.getByRole('button',{name:/Confirm this address/}).click();
 await expect(panel).toBeVisible();await expect(page.locator('#evidence')).toHaveAttribute('aria-hidden','false');
 await expect(panel.getByRole('heading',{name:'Places in perspective',exact:true})).toBeVisible();
 await expect(panel.locator('.index-measure').first()).toContainText('8.33');
 await expect(panel.locator('.index-measure').first()).toContainText('12.48');
 await expect(page.locator('.place-pin')).toHaveCount(2);
 await page.getByRole('button',{name:'More map',exact:true}).focus();await page.keyboard.press('Escape');await expect(page.getByRole('button',{name:'Open evidence',exact:true})).toBeFocused();
 await expect(map).toHaveAttribute('data-instance',instance!);
});
