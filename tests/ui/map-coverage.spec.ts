import {test,expect} from '@playwright/test';

test('statewide coverage stays resident through zoom/pan and recently used overlays are cached', async({page})=>{
  test.setTimeout(90000);
  await page.setViewportSize({width:1440,height:960});
  const requests:string[]=[];const errors:string[]=[];
  page.on('request',r=>{if(r.url().includes('/api/map?'))requests.push(r.url());});
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto('/');
  const map=page.locator('.atlas-map');
  await expect(map).toHaveAttribute('data-metric','pm',{timeout:45000});
  await expect(map).toHaveAttribute('data-features','9106');
  const initial=requests.length;
  expect(initial).toBe(1);
  expect(new URL(requests[0]).searchParams.get('bbox')).toBe('-125,32,-114,43');
  expect(new URL(requests[0]).searchParams.get('detail')).toBe('standard');
  await page.getByLabel('Search a California address').focus();
  await page.getByRole('button',{name:'Fresno',exact:true}).click();
  await page.getByRole('button',{name:/Confirm this address/}).click();

  await page.waitForTimeout(1800);
  for(let i=0;i<1;i++){await page.getByRole('button',{name:'Zoom in',exact:true}).click();await page.waitForTimeout(350);}
  for(let i=0;i<9;i++){await page.getByRole('button',{name:'Zoom out',exact:true}).click();await page.waitForTimeout(350);}
  // Pan the retained source, then wait beyond the former moveend debounce.
  await page.mouse.move(800,450);await page.mouse.down();await page.mouse.move(1050,400,{steps:12});await page.mouse.up();
  await page.waitForTimeout(1800);
  expect(requests).toHaveLength(initial);
  await expect(map).toHaveAttribute('data-features','9106');
  await expect(map).toHaveAttribute('data-tracts-rendered','true');
  await expect(page.locator('.map-update-status')).toHaveCount(0);
  await page.screenshot({path:'artifacts/statewide-overlay/resident-zoom-out.png'});
  await page.getByRole('button',{name:'Open evidence',exact:true}).click();
  await page.getByRole('combobox',{name:'Choose a measure'}).selectOption('ozone');
  await expect(map).toHaveAttribute('data-metric','ozone',{timeout:30000});
  expect(requests).toHaveLength(initial+1);
  await page.getByRole('combobox',{name:'Choose a measure'}).selectOption('pm');
  await expect(map).toHaveAttribute('data-metric','pm');
  expect(requests).toHaveLength(initial+1);
  await page.getByRole('button',{name:'Atlas menu'}).click();
  await page.locator(".atlas-menu-advanced > summary").click();
  await page.getByRole('button',{name:'Retry map & evidence'}).click();
  await expect.poll(()=>requests.length).toBe(initial+2);
  await expect(map).toHaveAttribute('data-metric','pm');
  expect(errors).toEqual([]);
});
