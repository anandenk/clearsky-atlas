"""Isolated MapLibre source comparison; no active frontend files used or changed.
Requires optional playwright==1.64.1 and installed Chrome.
"""
import json, threading, time, statistics
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from pathlib import Path
from urllib.request import urlopen
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'artifacts/buildings'; OUT.mkdir(parents=True,exist_ok=True)
V='2026-10-21.0'
class Handler(SimpleHTTPRequestHandler):
    def do_GET(self):
        if self.path=='/':
            self.send_response(200); self.send_header('Content-Type','text/html'); self.end_headers()
            self.wfile.write(b'''<html><link rel="stylesheet" href="/node_modules/maplibre-gl/dist/maplibre-gl.css"><style>body{margin:0;font:16px system-ui;background:#ece9df}main{display:flex}.map{width:50%;height:740px}h1{font-size:18px}</style><h1>OpenFreeMap buildings (left) / Overture pilot (right). Null height shown flat, no invented height.</h1><main><div class="map" id="old"></div><div class="map" id="new"></div></main><script type="module">import * as lib from '/node_modules/maplibre-gl/dist/maplibre-gl.mjs';window.lib=lib;</script></html>''')
        else: super().do_GET()
    def log_message(self,*args): pass
server=ThreadingHTTPServer(('127.0.0.1',0),lambda *a,**kw:Handler(*a,directory=str(ROOT),**kw))
threading.Thread(target=server.serve_forever,daemon=True).start()
report={}
with sync_playwright() as p:
    browser=p.chromium.launch(channel='chrome',headless=True)
    page=browser.new_page(viewport={'width':1440,'height':810})
    errors=[]; page.on('pageerror',lambda e:errors.append(str(e)))
    try:
        for name,center,bbox in [('rancho',[-117.552,34.127],[-117.562,34.117,-117.542,34.137]),('oakland',[-122.27,37.81],[-122.28,37.80,-122.26,37.82])]:
            url='http://127.0.0.1:3000/api/buildings?bbox='+','.join(map(str,bbox))+'&version='+V
            times=[]
            for _ in range(6):
                start=time.perf_counter(); raw=urlopen(url).read(); times.append((time.perf_counter()-start)*1000)
            data=json.loads(raw)
            page.goto(f'http://127.0.0.1:{server.server_port}/'); page.wait_for_load_state('networkidle'); page.wait_for_function('!!window.lib')
            page.evaluate('''async ({data,center})=>{
              lib.setWorkerUrl('/public/maplibre/maplibre-gl-worker.mjs');window.maps=[];
              await Promise.all(['old','new'].map(id=>new Promise(resolve=>{
                const map=new lib.Map({container:id,center,zoom:15.6,pitch:58,bearing:0,style:{version:8,sources:{},layers:[{id:'bg',type:'background',paint:{'background-color':'#e8e5da'}}]}});maps.push(map);
                map.on('load',()=>{
                  if(id==='old') {map.addSource('buildings',{type:'vector',url:'https://tiles.openfreemap.org/planet'});map.addLayer({id:'buildings',type:'fill-extrusion',source:'buildings','source-layer':'building',filter:['>', ['coalesce',['get','render_height'],0],0],paint:{'fill-extrusion-color':'#52716e','fill-extrusion-height':['get','render_height']}});}
                  else {map.addSource('buildings',{type:'geojson',data,attribution:'© OpenStreetMap contributors, Overture Maps Foundation (ODbL); Microsoft ML Buildings'});map.addLayer({id:'buildings',type:'fill-extrusion',source:'buildings',paint:{'fill-extrusion-color':['case',['==',['get','height'],null],'#b17d60','#52716e'],'fill-extrusion-height':['coalesce',['get','height'],0]}});map.addLayer({id:'footprints',type:'line',source:'buildings',paint:{'line-color':'#473b30','line-width':1}});}
                  map.once('idle',resolve);
                });
              })));
            }''',{'data':data,'center':center})
            page.wait_for_function('maps.every(m=>m.areTilesLoaded()&&!m.isMoving())',timeout=60000)
            counts=page.evaluate('''()=>maps.map(m=>({renderedFeatures:m.queryRenderedFeatures(undefined,{layers:['buildings']}).length,bounds:m.getBounds().toArray()}))''')
            page.screenshot(path=str(OUT/(name+'.png')))
            report[name]={'query':bbox,'count':len(data['features']),'nullHeight':sum(f['properties']['height'] is None for f in data['features']),'bytes':len(raw),'firstMs':times[0],'warmMedianMs':statistics.median(times[1:]),'rendered':counts}
        assert not errors,errors
        report['pageErrors']=errors
        (OUT/'verification.json').write_text(json.dumps(report,indent=2)+'\n')
        print(json.dumps(report,indent=2))
    finally: browser.close(); server.shutdown()
