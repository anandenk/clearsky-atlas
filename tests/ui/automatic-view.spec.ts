import {test, expect} from '@playwright/test';
function inspectMap() {
  const el = document.querySelector('.atlas-map') as any;
  let fiber = el[Object.keys(el).find(key => key.startsWith('__reactFiber'))!];
  while (fiber) {
    let hook = fiber.memoizedState;
    while (hook) {
      if (hook.memoizedState?.current?.getZoom) return hook.memoizedState.current;
      hook = hook.next;
    }
    fiber = fiber.return;
  }
  throw Error('Map instance unavailable');
}


test('Auto follows zoom with hysteresis; manual views and depth remain freely selectable', async ({page}) => {
  test.setTimeout(60000);
  await page.setViewportSize({width:1440,height:960});
  await page.goto('/');
  const map=page.locator('.atlas-map');
  const auto=page.getByRole('button',{name:'Auto',exact:true});
  const city=page.getByRole('button',{name:'City',exact:true});
  const landscape=page.getByRole('button',{name:'Data Landscape',exact:true});
  await expect(map).toHaveAttribute('data-metric','pm',{timeout:30000});
  const instance=await map.getAttribute('data-instance');
  await page.evaluate(`window.testMap = (${inspectMap.toString()})()`);
  const zoom=async(z:number)=>{await page.evaluate(z=>{(window as any).testMap.jumpTo({zoom:z});},z);};
  await expect(auto).toHaveAttribute('aria-pressed','true');
  await expect(landscape).toHaveAttribute('aria-pressed','true');
  await expect(map).toHaveAttribute('data-landscape-progress','1');
  await zoom(12);
  await expect(city).toHaveAttribute('aria-pressed','true');
  await expect(map).toHaveAttribute('data-landscape-progress','0');
  await zoom(11.5);await expect(city).toHaveAttribute('aria-pressed','true');
  await zoom(11);await expect(landscape).toHaveAttribute('aria-pressed','true');
  await zoom(11.5);await expect(landscape).toHaveAttribute('aria-pressed','true');
  await city.click();await expect(auto).toHaveAttribute('aria-pressed','false');
  await zoom(8);await expect(city).toHaveAttribute('aria-pressed','true');
  await auto.click();await expect(landscape).toHaveAttribute('aria-pressed','true');
  await landscape.click();await zoom(14);await expect(landscape).toHaveAttribute('aria-pressed','true');
  await page.getByRole('button',{name:'Flat',exact:true}).click();
  await auto.click();await expect(city).toHaveAttribute('aria-pressed','true');
  await zoom(10);await expect(page.getByRole('button',{name:'Flat',exact:true})).toHaveAttribute('aria-pressed','true');
  await expect(map).toHaveAttribute('data-landscape-progress','0');
  await expect(map).toHaveAttribute('data-instance',instance!);
  const width=process.env.ATLAS_DESKTOP_ONLY === '1' ? 1440 : 320;
  await page.setViewportSize({width,height:960});
  const box=await page.locator('.view-switch').boundingBox();
  expect(box!.x).toBeGreaterThanOrEqual(0);expect(box!.x+box!.width).toBeLessThanOrEqual(width);
  await page.screenshot({path:`artifacts/automatic-view/controls-${width}.png`});
});

function mapsForTest() {
  return [...document.querySelectorAll(".atlas-map")].map((el: any) => {
    let f = el[Object.keys(el).find((k) => k.startsWith("__reactFiber"))!];
    while (f) {
      let h = f.memoizedState;
      while (h) {
        if (h.memoizedState?.current?.getZoom) return h.memoizedState.current;
        h = h.next;
      }
      f = f.return;
    }
    throw Error("Map unavailable");
  });
}

test('Auto waits for a right-pane camera flight to finish before changing relief',async({page})=>{
  test.setTimeout(60000);
  await page.setViewportSize({width:1440,height:960});await page.goto('/?geography=1');
  await expect(page.locator('.atlas-map')).toHaveAttribute('data-metric','pm',{timeout:30000});
  for(const name of ['Oakland','Fresno']){
    await page.getByLabel('Search a California address').focus();
    await page.getByRole('button',{name,exact:true}).click();
    await page.getByRole('button',{name:/Confirm this address/}).click();
  }
  await page.getByRole('button',{name:'Compare geography',exact:true}).click();
  const maps=page.locator('.atlas-map');await expect(maps).toHaveCount(2);
  for(const map of await maps.all())await expect(map).toHaveAttribute('data-metric','pm',{timeout:30000});
  await page.evaluate(`window.testMaps = (${mapsForTest.toString()})()`);
  await page.evaluate(()=>{const m=(window as any).testMaps[1];m.jumpTo({zoom:13,pitch:0});m.easeTo({zoom:9,duration:1200,essential:true});});
  await expect.poll(()=>page.evaluate(()=>(window as any).testMaps[1].getZoom())).toBe(9);
  await expect(page.getByRole('button',{name:'Auto',exact:true})).toHaveAttribute('aria-pressed','true');
  for(const map of await maps.all())await expect(map).toHaveAttribute('data-landscape-progress','1');
});
