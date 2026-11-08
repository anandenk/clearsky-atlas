import {test,expect} from '@playwright/test';
import {compatible,delta,format,type Observation} from '../../src/frontend/provider';
test('same comparison key cannot bypass definition and source compatibility',()=>{
 const a:Observation={indicatorId:'pm',rawValue:8,percentile:40,unit:'µg/m³',measurementPeriod:'2022–2024',comparisonKey:'same',definition:'Tract mean',definitionSource:'source',datasetVersion:'v1',geographicLevel:'tract',provenance:{sha256:'abc'}};
 expect(delta(a,{...a,rawValue:8.004})).toBeCloseTo(.004);
 expect(format(.004,'pm')).toBe('0.004');expect(format(0,'pm')).toBe('0');
 for(const patch of [{definition:'Other'},{provenance:{sha256:'other'}},{datasetVersion:'v2'},{geographicLevel:'county'},{unit:'other'},{measurementPeriod:'other'}]){expect(compatible(a,{...a,...patch})).toBe(false);expect(delta(a,{...a,...patch})).toBeNull();}
 expect(delta(a,{...a,rawValue:null})).toBeNull();
});

test('legend retains PM while ozone is delayed and facility requests pin versions',async({page})=>{
 test.setTimeout(60000);await page.goto('/');await expect(page.locator('.atlas-map')).toHaveAttribute('data-metric','pm',{timeout:30000});
 let release!:()=>void;const hold=new Promise<void>(r=>release=r);
 await page.route('**/api/map?**',async route=>{if(new URL(route.request().url()).searchParams.get('indicator')==='ozone')await hold;await route.continue();});
 await page.getByRole('button',{name:'Ozone',exact:true}).click();await expect(page.locator('.map-key')).toContainText('Fine particulate matter');await expect(page.locator('.map-key')).toContainText('Showing last loaded layer');
 await page.getByRole('button',{name:'About this measure',exact:true}).click();
 await expect(page.getByRole('dialog').locator('h3')).toHaveText('Fine particulate matter');
 await page.keyboard.press('Escape');release();
 await expect(page.locator('.atlas-map')).toHaveAttribute('data-metric','ozone',{timeout:30000});await expect(page.locator('.map-key')).toContainText('Ozone');
 await page.getByLabel('Search a California address').focus();await page.getByRole('button',{name:'Oakland',exact:true}).click();await page.getByRole('button',{name:/Confirm this address/}).click();
 const requests:string[]=[];page.on('request',r=>{if(r.url().includes('/api/facilities?') && new URL(r.url()).searchParams.has('near'))requests.push(r.url());});
 await page.getByRole('button',{name:'Infrastructure',exact:true}).click();await expect.poll(()=>requests.length).toBe(2);for(const url of requests)expect(new URL(url).searchParams.get('version')).toBeTruthy();
});
