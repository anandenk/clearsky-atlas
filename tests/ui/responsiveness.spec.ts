import {test, expect} from '@playwright/test';

// Test-only inspection: no map instance or renderer internals exposed by the app.
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

test('relief updates stay bounded during navigation, controls respond and final heights remain exact', async ({page}) => {
  test.setTimeout(60000);
  await page.setViewportSize({width:1440,height:960});
  await page.goto('/');
  const map=page.locator('.atlas-map');
  await expect(map).toHaveAttribute('data-metric','pm');
  await page.evaluate(`window.testMap = (${inspectMap.toString()})()`);
  await page.getByRole('button',{name:'Data Landscape',exact:true}).click();
  await expect(map).toHaveAttribute('data-landscape-progress','1');
  await page.evaluate(()=>{
    const w=window as any,m=w.testMap;
    w.heightWrites=[];
    const original=m.setPaintProperty;
    m.setPaintProperty=function(...args:any[]){
      if(args[1]==='fill-extrusion-height')w.heightWrites.push(args);
      return original.apply(this,args);
    };
    m.flyTo({center:[-118.24,34.05],zoom:12,pitch:50,bearing:25,duration:2500,essential:true});
  });
  await page.getByText('Map sources & limits',{exact:true}).click();
  await expect(page.locator('.map-provenance')).toHaveAttribute('open','');
  // The disclosure responds while the same camera flight is still underway.
  expect(await page.evaluate(()=>(window as any).testMap.isMoving())).toBe(true);
  await expect(map).toHaveAttribute('data-height-scale','9',{timeout:15000});
  const result=await page.evaluate(()=>{
    const w=window as any,m=w.testMap;
    const active=[0,1].find(i=>m.getPaintProperty('landscape'+i,'fill-extrusion-opacity')>0);
    return {writes:w.heightWrites.length,layers:[...new Set(w.heightWrites.map((x:any)=>x[0]))],
      height:m.getPaintProperty('landscape'+active,'fill-extrusion-height'),features:document.querySelector('.atlas-map')?.getAttribute('data-features')};
  });
  expect(result.writes).toBeLessThan(40);
  expect(result.layers).toHaveLength(1);
  expect(result.height).toEqual(['*',['coalesce',['get','percentile'],0],9]);
  expect(result.features).toBe('9106');
  await page.getByRole('button',{name:'City',exact:true}).click();
  await expect(map).toHaveAttribute('data-landscape-progress','0');
});

test('normal browsing omits expensive whole-map diagnostic queries',async({page})=>{
  await page.addInitScript(()=>localStorage.removeItem('atlas-render-diagnostics'));
  await page.goto('/');
  const map=page.locator('.atlas-map');
  await expect(map).toHaveAttribute('data-metric','pm');
  await expect(map).toHaveAttribute('data-ready','true');
  expect(await map.getAttribute('data-buildings-rendered')).toBeNull();
  expect(await map.getAttribute('data-landscape-rendered')).toBeNull();
});
