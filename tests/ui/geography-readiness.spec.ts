import {test} from '@playwright/test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {stripTypeScriptTypes} from 'node:module';

// Deterministic checks execute the production gate/wait without browser work.
const atlas = readFileSync('src/AtlasMap.tsx','utf8');
const compile = (body: string, args: string[] = []) => new Function(...args,
  'return ('+stripTypeScriptTypes('function snippet(){\n'+body+'\n}')+').apply(this, arguments);');
const gateCode = readFileSync('src/frontend/linked-geography.ts','utf8');
const OverlayGate = compile(gateCode.slice(gateCode.indexOf('export class OverlayGate'),
  gateCode.indexOf('export type LinkedPane')).replace('export class','class')+'\nreturn OverlayGate;')();
const sourceReady = compile(atlas.slice(atlas.indexOf('const sourceReady ='),
  atlas.indexOf('\nexport default function'))+'\nreturn sourceReady;')();
const wait = compile('return (async()=>{'+atlas.slice(atlas.indexOf('        const incomingSource ='),
  atlas.indexOf('        if (request.signal.aborted || g !== generation || map.current !== m) return;'))+'})();',
  ['m','p','next','request','incomingHeight','stagedHeight','stageHeight','sourceReady']);
const flush = async () => {for(let i=0;i<6;i++)await Promise.resolve();};
function pane(gate: any, side: string) {
  const listeners = new Map<string, Set<(...args:any[])=>void>>();
  const controller = new AbortController();
  const m = {
    loaded:true, restages:0, done:false,
    on(name:string, fn:(...args:any[])=>void){if(!listeners.has(name))listeners.set(name,new Set());listeners.get(name)!.add(fn);},
    off(name:string, fn:(...args:any[])=>void){listeners.get(name)?.delete(fn);},
    fire(name:string,event={}){for(const fn of [...listeners.get(name)??[]])fn(event);},
    getSource(){return this;}, isSourceLoaded(){return this.loaded;}, triggerRepaint(){},
    count(){return [...listeners.values()].reduce((n,s)=>n+s.size,0);},
  };
  const promise = wait(m,{linked:{gate,side}},1,controller,()=>9,9,()=>{m.restages++;},sourceReady)
    .then(()=>{m.done=true;});
  return {m,controller,promise};
}

test('a same-height pan makes both panes restage before release',async()=>{
  const gate=new OverlayGate(), left=pane(gate,'left'), right=pane(gate,'right');
  left.m.fire('render');await flush();
  left.m.loaded=false; // Zoom >=10: same height, newly requested tiles pending.
  right.m.fire('render');await flush();
  assert.equal(left.m.done,false);assert.equal(right.m.done,false);
  assert.equal(left.m.restages,1);assert.equal(right.m.restages,1);
  left.m.loaded=true;left.m.fire('render');right.m.fire('render');
  await Promise.all([left.promise,right.promise]);
  assert.equal(left.m.count(),0);assert.equal(right.m.count(),0);
});

test('source errors during the gate wait fail both panes; cancellation cleans listeners',async()=>{
  const gate=new OverlayGate(), left=pane(gate,'left'), right=pane(gate,'right');
  const results=Promise.allSettled([left.promise,right.promise]);
  left.m.fire('render');await flush();
  left.m.fire('error',{sourceId:'other',error:new Error('unrelated')});
  left.m.fire('error',{sourceId:'tracts1',error:new Error('late tile failure')});
  right.m.fire('render');
  assert.ok((await results).every(r=>r.status==='rejected'));
  assert.equal(left.m.done,false);assert.equal(right.m.done,false);
  assert.equal(left.m.count(),0);assert.equal(right.m.count(),0);
  const nextGate=new OverlayGate(), a=pane(nextGate,'left'),b=pane(nextGate,'right');
  const cancelled=Promise.allSettled([a.promise,b.promise]);
  a.m.fire('render');await flush();a.controller.abort();b.controller.abort();
  assert.ok((await cancelled).every(r=>r.status==='rejected' && r.reason.name==='AbortError'));
  assert.equal(a.m.count(),0);assert.equal(b.m.count(),0);
});

test('map facility callbacks select the clicked pane inventory and preserve nonlinked selection',()=>{
  const page=readFileSync('app/page.tsx','utf8');
  const callbacks=[...page.matchAll(/onFacility=\{(id=>\{[^}]+\})\}/g)].map(m=>m[1]);
  assert.equal(callbacks.length,2);
  const calls:string[]=[];
  const callback=(side:number,linked:boolean)=>new Function('linked','leftPlace','rightPlace','setActive','setFacility',
    'return ('+callbacks[side]+');')(linked,{id:'A'},{id:'B'},(id:string)=>calls.push('active:'+id),(id:string)=>calls.push('facility:'+id));
  callback(1,true)('right-only');assert.deepEqual(calls.splice(0),['active:B','facility:right-only']);
  callback(0,true)('left-only');assert.deepEqual(calls.splice(0),['active:A','facility:left-only']);
  callback(0,false)('solo');assert.deepEqual(calls,['facility:solo']);
});

test('linked exit preserves entry framing only at unchanged width and height, including place replacement',()=>{
  const attachCode=atlas.slice(atlas.indexOf('    const m=map.current, linked=p.linked;'),
    atlas.indexOf('  },[ready,p.linked?.camera,p.linked?.placeId'));
  const normalStart=atlas.indexOf('    if(p.linked)return;');
  const normalCode=atlas.slice(normalStart,atlas.indexOf('    const mobile =',normalStart));
  // Browser viewport globals must be read at cleanup time, not captured values.
  const browserAttach=compile(attachCode.replaceAll('innerWidth','window.innerWidth').replaceAll('innerHeight','window.innerHeight'),
    ['map','p','ready','linkedViewport','restoredCamera','window']);
  const normal=compile(normalCode,['p','linkedViewport','restoredCamera','m']);
  for(const [width,height,replace] of [[1440,960,false],[375,812,false],[1440,812,false],[375,812,true]] as const){
    const viewport={innerWidth:1440,innerHeight:960},linkedViewport={current:null},restoredCamera={current:false};
    let resized=0;
    const m={resize:()=>resized++},p={linked:{side:'left',coordinate:[0,0],camera:{attach:()=>()=>{}}}};
    let detach=browserAttach({current:m},p,true,linkedViewport,restoredCamera,viewport);
    viewport.innerWidth=width;viewport.innerHeight=height;
    if(replace){detach();detach=browserAttach({current:m},p,true,linkedViewport,restoredCamera,viewport);}
    detach();normal({linked:undefined},linkedViewport,restoredCamera,m);
    assert.equal(resized,width===1440 && height===960?0:1);
    assert.equal(linkedViewport.current,null);assert.equal(restoredCamera.current,false);
  }
});
