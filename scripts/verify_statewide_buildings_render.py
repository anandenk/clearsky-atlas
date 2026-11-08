"""Isolated desktop verification of statewide vector tiles; no frontend changes."""
import json, threading
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from pathlib import Path
from urllib.request import urlopen
from urllib.error import HTTPError
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'artifacts/buildings-statewide';OUT.mkdir(parents=True,exist_ok=True)
class Handler(SimpleHTTPRequestHandler):
    def do_GET(self):
        if self.path.startswith('/api/buildings/'):
            try:
                r=urlopen('http://127.0.0.1:3000'+self.path); self.send_response(r.status);self.send_header('Content-Type',r.headers.get('Content-Type','application/octet-stream'));self.end_headers();self.wfile.write(r.read())
            except HTTPError as e:
                self.send_response(e.code);self.end_headers();self.wfile.write(e.read())
        elif self.path=='/':
            self.send_response(200);self.send_header('Content-Type','text/html');self.end_headers()
            self.wfile.write(b'''<html><link rel="stylesheet" href="/node_modules/maplibre-gl/dist/maplibre-gl.css"><style>body{margin:0;background:#e8e5da;font:16px system-ui}h1{font-size:18px}.map{height:720px;width:50%}main{display:flex}</style><h1>Statewide Overture tile service: supplied heights; unknown heights flat/orange. Desktop technical harness.</h1><main><div id="a" class="map"></div><div id="b" class="map"></div></main><script type="module">import * as lib from '/node_modules/maplibre-gl/dist/maplibre-gl.mjs';window.lib=lib;</script></html>''')
        else:super().do_GET()
    def log_message(self,*args):pass
server=ThreadingHTTPServer(('127.0.0.1',0),lambda *a,**kw:Handler(*a,directory=str(ROOT),**kw))
threading.Thread(target=server.serve_forever,daemon=True).start()
report={}
with sync_playwright() as p:
    browser=p.chromium.launch(channel='chrome',headless=True)
    page=browser.new_page(viewport={'width':1440,'height':800});errors=[]
    page.on('pageerror',lambda e:errors.append(str(e)))
    try:
        for group,centers in [('acceptance',[[-117.552,34.127],[-122.27,37.81]]),('statewide',[[-124.163,40.802],[-117.16,32.72]])]:
            page.goto(f'http://127.0.0.1:{server.server_port}/');page.wait_for_load_state('networkidle');page.wait_for_function('!!window.lib')
            page.evaluate('''async centers=>{
              lib.setWorkerUrl('/public/maplibre/maplibre-gl-worker.mjs');window.maps=[];window.mapErrors=[];
              const catalog=await (await fetch('/api/buildings/catalog?version=2026-10-21.0')).json();
              await Promise.all(['a','b'].map((id,i)=>new Promise(resolve=>{
                const m=new lib.Map({container:id,center:centers[i],zoom:15.6,pitch:58,style:{version:8,sources:{},layers:[{id:'bg',type:'background',paint:{'background-color':'#e8e5da'}}]}});maps.push(m);
                m.on('error',e=>mapErrors.push(String(e.error)));
                m.on('load',()=>{
                  m.addSource('overture',{type:'vector',tiles:catalog.tiles.map(t=>location.origin+t),minzoom:14,maxzoom:14,bounds:catalog.bounds,attribution:catalog.attribution});
                  m.addLayer({id:'buildings',type:'fill-extrusion',source:'overture','source-layer':'building',filter:['all',['!=',['get','is_underground'],true],['!=',['get','has_parts'],true]],paint:{'fill-extrusion-color':['case',['has','height'],'#52716e','#b17d60'],'fill-extrusion-height':['coalesce',['get','height'],0]}});
                  m.addLayer({id:'parts',type:'fill-extrusion',source:'overture','source-layer':'building_part',filter:['!=',['get','is_underground'],true],paint:{'fill-extrusion-color':['case',['has','height'],'#52716e','#b17d60'],'fill-extrusion-height':['coalesce',['get','height'],0],'fill-extrusion-base':['coalesce',['get','min_height'],0]}});
                  m.addLayer({id:'footprints',type:'line',source:'overture','source-layer':'building',paint:{'line-color':'#473b30','line-width':0.6}});
                  m.once('idle',resolve);
                });
              })));
            }''',centers)
            page.wait_for_function('maps.every(m=>m.areTilesLoaded()&&!m.isMoving())',timeout=60000)
            stats=page.evaluate('''()=>maps.map(m=>({rendered:m.queryRenderedFeatures(undefined,{layers:['buildings']}).length,missingHeight:m.querySourceFeatures('overture',{sourceLayer:'building'}).filter(f=>f.properties.height===undefined).length,parts:m.querySourceFeatures('overture',{sourceLayer:'building_part'}).length}))''')
            assert all(s['rendered']>100 for s in stats),stats
            assert page.evaluate('mapErrors')==[],page.evaluate('mapErrors')
            page.screenshot(path=str(OUT/(group+'.png')))
            report[group]=stats
        assert not errors,errors
        report['pageErrors']=errors;(OUT/'render.json').write_text(json.dumps(report,indent=2)+'\n');print(json.dumps(report,indent=2))
    finally:browser.close();server.shutdown()
