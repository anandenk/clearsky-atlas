import {test,expect} from '@playwright/test';
import {StatewideOverlays} from '../../src/frontend/map-coverage';
test('paired consumers share one payload, cancellation is independent, and retry invalidates once',async()=>{
 const original=globalThis.fetch;
 const pending:{signal:AbortSignal;resolve:(response:Response)=>void}[]=[];
 globalThis.fetch=((_url,init)=>new Promise<Response>((resolve,reject)=>{
  const signal=init!.signal as AbortSignal;pending.push({signal,resolve});
  signal.addEventListener('abort',()=>reject(new DOMException('Superseded','AbortError')),{once:true});
 })) as typeof fetch;
 const payload={type:'FeatureCollection',features:[]}; // Explicit empty test geometry.
 try{
  const cache=new StatewideOverlays(),a=new AbortController(),b=new AbortController();
  const left=cache.load('pm',a.signal),right=cache.load('pm',b.signal);
  expect(pending).toHaveLength(1);const cancelled=expect(left).rejects.toMatchObject({name:'AbortError'});a.abort();await cancelled;
  expect(pending[0].signal.aborted).toBe(false);pending[0].resolve(Response.json(payload));await expect(right).resolves.toEqual(payload);
  await cache.load('pm',new AbortController().signal);expect(pending).toHaveLength(1);
  cache.clear(7);const retry=cache.load('pm',new AbortController().signal);cache.clear(7);
  expect(pending).toHaveLength(2);expect(pending[1].signal.aborted).toBe(false);pending[1].resolve(Response.json(payload));await retry;
  const c=new AbortController(),d=new AbortController();
  const abandoned=Promise.allSettled([cache.load('ozone',c.signal),cache.load('ozone',d.signal)]);c.abort();d.abort();
  expect((await abandoned).every(x=>x.status==='rejected')).toBe(true);expect(pending[2].signal.aborted).toBe(true);
  const fresh=cache.load('ozone',new AbortController().signal);expect(pending).toHaveLength(4);pending[3].resolve(Response.json(payload));await fresh;
 }finally{globalThis.fetch=original;}
});
