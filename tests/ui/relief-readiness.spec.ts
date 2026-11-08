import {test} from '@playwright/test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {stripTypeScriptTypes} from 'node:module';

// Exercise the production wait/scheduler without a browser, workers or server.
const source = readFileSync(new URL('../../src/AtlasMap.tsx', import.meta.url), 'utf8');
const compile = (body: string, args: string[] = []) =>
  new Function(...args, 'return (' + stripTypeScriptTypes('function snippet(){\n' + body + '\n}') + ').apply(this, arguments);');
const sourceReady = compile(source.slice(source.indexOf('const sourceReady ='),
  source.indexOf('\nexport default function')) + '\nreturn sourceReady;')();

class SourceMap {
  loaded = true;
  zoom = 12;
  writes: any[][] = [];
  listeners = new Map<string, Set<(...args: any[]) => void>>();
  on(name: string, fn: (...args: any[]) => void) {
    if (!this.listeners.has(name)) this.listeners.set(name, new Set());
    this.listeners.get(name)!.add(fn);
  }
  off(name: string, fn: (...args: any[]) => void) { this.listeners.get(name)?.delete(fn); }
  fire(name: string, event = {}) { for (const fn of [...this.listeners.get(name) ?? []]) fn(event); }
  triggerRepaint() {}
  getSource() { return this; }
  getLayer() { return true; }
  getZoom() { return this.zoom; }
  isSourceLoaded() { return this.loaded; }
  setPaintProperty(...args: any[]) { this.writes.push(args); }
  listenerCount() { return [...this.listeners.values()].reduce((n, set) => n + set.size, 0); }
}

test('source readiness crosses the style render barrier and cleans up on success, error and abort', async () => {
  const m = new SourceMap(), controller = new AbortController();
  let settled = false;
  const ready = sourceReady(m, 'tracts1', controller.signal, true).then(() => {settled = true;});
  m.fire('sourcedata'); await Promise.resolve();
  assert.equal(settled, false); // Still reports loaded before style processing.
  m.loaded = false; m.fire('render'); await Promise.resolve();
  assert.equal(settled, false);
  m.loaded = true; m.fire('sourcedata'); await ready;
  assert.equal(m.listenerCount(), 0);
  const failed = sourceReady(m, 'tracts1', controller.signal, true);
  const rejected = assert.rejects(failed, /tile failure/);
  m.fire('error', {sourceId: 'unrelated', error: new Error('ignored')});
  m.fire('error', {sourceId: 'tracts1', error: new Error('tile failure')});
  await rejected; assert.equal(m.listenerCount(), 0);
  const aborted = sourceReady(m, 'tracts1', controller.signal, true);
  const cancelled = assert.rejects(aborted, {name: 'AbortError'});
  controller.abort(); await cancelled; assert.equal(m.listenerCount(), 0);
});

test('hidden incoming heights catch camera changes and reversal before reveal without updating the legend', async () => {
  const m = new SourceMap(), request = new AbortController(), growth = {current: 1};
  const block = source.slice(source.indexOf('        const incomingHeight ='),
    source.indexOf('        if (request.signal.aborted || g !== generation || map.current !== m) return;'));
  const stage = compile('return (async () => {' + block + '})();',
    ['m', 'next', 'growth', 'request', 'tagged', 'sourceReady', 'metresPerPercentileAtZoom', 'p']);
  (m as any).setData = async () => {};
  let revealed = false;
  const pending = stage(m, 1, growth, request, {}, sourceReady, (zoom: number) => zoom < 10 ? 36 : 9, {})
    .then(() => {revealed = true;});
  await Promise.resolve();
  m.zoom = 8; growth.current = .5; // Camera change plus interrupted shrink.
  m.fire('render'); await Promise.resolve(); await Promise.resolve();
  assert.equal(revealed, false);
  assert.deepEqual(m.writes.map(x => x[2][2]), [9, 18]);
  // The second submission must cross its own render barrier, even if loaded.
  m.fire('sourcedata'); await Promise.resolve(); assert.equal(revealed, false);
  m.fire('render'); await pending;
  assert.equal(revealed, true); assert.equal(m.listenerCount(), 0);
  assert.ok(m.writes.every(x => x[0] === 'landscape1' && x[1] === 'fill-extrusion-height'));
});

test('a final tile error wakes the stopped height scheduler and cleanup removes all work', () => {
  const m = new SourceMap(); let now = 0, id = 0;
  const frames = new Map<number, () => void>(), timers = new Map<number, {fn: () => void; at: number}>();
  const run = compile(source.slice(source.indexOf('    const target=p.landscape'),
    source.indexOf('  },[ready,p.landscape')), ['m','p','rendered','growth','performance','reduced',
      'metresPerPercentileAtZoom','container','latest','requestAnimationFrame','cancelAnimationFrame','window','clearTimeout']);
  const cleanup = run(m, {landscape:true,overview:false}, {mode:'Environment',slot:0,metric:{percentileField:'p'}},
    {current:0}, {now:()=>now}, ()=>false, ()=>9, {current:{dataset:{}}}, {current:{onHeightScale:()=>{}}},
    (fn:()=>void)=>{frames.set(++id,fn);return id;}, (n:number)=>frames.delete(n),
    {setTimeout:(fn:()=>void, delay:number)=>{timers.set(++id,{fn,at:now+delay});return id;}}, (n:number)=>timers.delete(n));
  m.loaded = false;
  const tick = () => { const due=[...frames.values()]; frames.clear(); due.forEach(fn=>fn()); };
  for(now=16;now<1200;now+=16) tick();
  assert.equal(frames.size, 0); assert.equal(timers.size, 0);
  m.loaded = true;
  m.fire('error', {sourceId:'tracts0',error:new Error('last tile failed')}); tick();
  assert.deepEqual(m.writes.filter(x=>x[1]==='fill-extrusion-height').at(-1)?.[2],
    ['*',['coalesce',['get','percentile'],0],9]);
  assert.equal(frames.size, 0); assert.equal(timers.size, 0);
  cleanup(); assert.equal(m.listenerCount(), 0);
  m.fire('idle'); assert.equal(frames.size, 0);
});
