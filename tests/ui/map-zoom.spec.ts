import { test, expect } from '@playwright/test';

test('land-use fills stay below thematic shading across neighborhood zooms', async ({page, request}) => {
  test.setTimeout(90000);
  const style = await (await request.get('/ui/basemap.json')).json();
  const water = style.layers.findIndex((l: any) => l.id === 'water');
  for (const [i, layer] of style.layers.entries()) {
    if (layer.type === 'fill' && !['water', 'building'].includes(layer.id)) expect(i).toBeLessThan(water);
  }
  expect(style.layers.find((l: any) => l.id === 'building').type).toBe('line');
  for (const layer of style.layers) if (layer.type === 'fill' && layer.id !== 'water') expect(layer.paint['fill-opacity']).toBe(0);
  const errors: string[] = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.setViewportSize({width:1440,height:960});
  await page.goto('/');
  await page.getByLabel('Search a California address').focus();
  await page.getByRole('button',{name:'Fresno',exact:true}).click();
  await page.getByRole('button',{name:/Confirm this address/}).click();
  await page.getByRole('button',{name:'Open evidence',exact:true}).click();
  await page.getByRole('combobox',{name:'Choose a measure'}).selectOption('traffic');
  await page.getByRole('button',{name:'More map',exact:true}).click();
  const map = page.locator('.atlas-map');
  await expect(map).toHaveAttribute('data-metric','traffic');
  await expect(map).toHaveAttribute('data-tracts-rendered','true');
  await page.waitForTimeout(1800);
  const instance = await map.getAttribute('data-instance');
  for(let i=0;i<1;i++) {
    await page.getByRole('button',{name:'Zoom in',exact:true}).click();
    await page.waitForTimeout(1000);
    await expect(map).toHaveAttribute('data-tracts-rendered','true');
    if(i>=2) await page.screenshot({path:`artifacts/zoom-fix/fresno-zoom-step-${i+1}.png`});
  }
  await expect(page.getByRole('button',{name:'Zoom in',exact:true})).toBeDisabled();
  await page.getByRole('button',{name:'Zoom out',exact:true}).click();
  await page.waitForTimeout(1200);
  await page.screenshot({path:'artifacts/zoom-fix/fresno-return-zoom.png'});
  await expect(map).toHaveAttribute('data-instance',instance!);
  expect(errors).toEqual([]);
});
