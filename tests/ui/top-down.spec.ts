import {test,expect} from '@playwright/test';
test('manual top-down pitch selects Flat and explicit 3D restores relief',async({page})=>{
 test.setTimeout(60000);await page.emulateMedia({reducedMotion:'reduce'});await page.goto('/');
 const map=page.locator('.atlas-map');await expect(map).toHaveAttribute('data-metric','pm',{timeout:30000});
 await page.getByRole('button',{name:'Data Landscape',exact:true}).click();
 await expect(map).toHaveAttribute('data-landscape-progress','1');
 await expect.poll(async()=>JSON.parse((await map.getAttribute('data-camera'))||'{}').pitch).toBe(50);
 const instance=await map.getAttribute('data-instance');await page.locator('.maplibregl-canvas').focus();
 for(let pitch=40;pitch>=0;pitch-=10){await page.keyboard.press('Shift+ArrowDown');await expect.poll(async()=>JSON.parse((await map.getAttribute('data-camera'))||'{}').pitch).toBe(pitch);}
 await expect(page.getByRole('button',{name:'Flat',exact:true})).toHaveAttribute('aria-pressed','true');
 await expect(map).toHaveAttribute('data-landscape-progress','0');
 await expect(page.locator('.map-key')).toContainText('Flat landscape');
 await page.getByRole('button',{name:'3D',exact:true}).click();
 await expect(map).toHaveAttribute('data-landscape-progress','1');
 await expect.poll(async()=>JSON.parse((await map.getAttribute('data-camera'))||'{}').pitch).toBe(50);
 await expect(map).toHaveAttribute('data-instance',instance!);
});
