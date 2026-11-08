import type {Map as AtlasMap, GeoJSONSource} from 'maplibre-gl';
const version='2026-10-21.0';
const regions=[{name:'Rancho Cucamonga',bbox:[-117.572,34.107,-117.532,34.147]}, {name:'Oakland',bbox:[-122.29,37.79,-122.25,37.83]}];
type Payload=GeoJSON.FeatureCollection & {metadata:{datasetVersion:string;contractVersion:string;truncated:boolean;coverage:{region:string}}};
const cache=new Map<string,{data:Payload;bytes:number}>();let cacheBytes=0;
async function fetchCell(bounds:number[],signal:AbortSignal){
 const key=bounds.map(n=>n.toFixed(6)).join(',');const hit=cache.get(key);
 if(hit){cache.delete(key);cache.set(key,hit);return hit.data;}
 const response=await fetch(`/api/buildings?bbox=${key}&version=${version}`,{signal});
 const body=await response.text();const data=JSON.parse(body);
 if(!response.ok)throw Error(data.error || 'Building source unavailable');
 if(data.metadata?.contractVersion!=='atlas-buildings-v1' || data.metadata?.datasetVersion!==version || data.metadata.truncated!==false || !Array.isArray(data.features))throw Error('Building source contract mismatch');
 if(body.length>4000000 || data.features.length>5000)throw Error('Building response exceeds display limits');
 if(signal.aborted)throw new DOMException('Superseded','AbortError');
 cache.set(key,{data,bytes:body.length});cacheBytes+=body.length;
 while(cacheBytes>12000000 || cache.size>12){const k=cache.keys().next().value!;cacheBytes-=cache.get(k)!.bytes;cache.delete(k);}
 return data as Payload;
}
export function installBuildings(m:AtlasMap,report:(message:string)=>void,ready:(m:AtlasMap,id:string,signal:AbortSignal,afterRender:boolean)=>Promise<void>){
 const source='overture-buildings',layer='overture-buildings-3d';
 m.addSource(source,{type:'geojson',data:{type:'FeatureCollection',features:[]},attribution:'© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>, <a href="https://docs.overturemaps.org/attribution/">Overture Maps Foundation</a>, <a href="https://github.com/microsoft/GlobalMLBuildingFootprints">Microsoft ML Buildings</a> · <a href="https://opendatacommons.org/licenses/odbl/1-0/">ODbL-1.0</a>'});
 m.addLayer({id:layer,type:'fill-extrusion',source,minzoom:15,filter:['!=',['get','isUnderground'],true],paint:{
  'fill-extrusion-color':['case',['==',['get','height'],null],'#a8b3ab','#84918f'],
  // Rendering defaults only. Source height/levels remain unchanged and nullable.
  'fill-extrusion-height':['case',['!=',['get','height'],null],['get','height'],['!=',['get','levels'],null],['*',['get','levels'],3],6],
  'fill-extrusion-base':['case',['!=',['get','height'],null],['min',['get','height'],['coalesce',['get','minHeight'],0]],0],
  'fill-extrusion-opacity':0,'fill-extrusion-opacity-transition':{duration:0},
 }},m.getStyle().layers.find(l=>l.type==='symbol')?.id);
 let enabled=false,opacity=.7,active=false,generation=0,timer:ReturnType<typeof setTimeout>,request:AbortController|undefined;
 const paint=()=>{if(m.getLayer(layer))m.setPaintProperty(layer,'fill-extrusion-opacity',active?opacity:0);if(m.getLayer('city-buildings'))m.setPaintProperty('city-buildings','fill-extrusion-opacity',active?0:opacity);};
 const fallback=(message:string)=>{active=false;paint();report(message);};
 const update=async()=>{
  const token=++generation;request?.abort();request=new AbortController();const signal=request.signal;
  if(!enabled)return;
  if(m.getZoom()<15){fallback('OpenStreetMap buildings · zoom in for Overture pilot coverage.');return;}
  const b=m.getBounds(),view=[b.getWest(),b.getSouth(),b.getEast(),b.getNorth()];
  const region=regions.find(r=>view[0]<r.bbox[2]&&view[2]>r.bbox[0]&&view[1]<r.bbox[3]&&view[3]>r.bbox[1]);
  if(!region){fallback('OpenStreetMap buildings · outside the Overture pilot areas.');return;}
  const [w,s,e,n]=region.bbox;
  const cells:number[][]=[];
  for(let x=0;x<4;x++)for(let y=0;y<4;y++){
   const cell=[w+x*.01,s+y*.01,w+(x+1)*.01,s+(y+1)*.01];
   if(cell[0]<view[2]&&cell[2]>view[0]&&cell[1]<view[3]&&cell[3]>view[1])cells.push(cell);
  }
  const partial=view[0]<w||view[1]<s||view[2]>e||view[3]>n;
  report('Loading Overture buildings…');
  try{
   const features=new Map<string,GeoJSON.Feature>();
   for(let i=0;i<cells.length;i+=2){
    const results=await Promise.all(cells.slice(i,i+2).map(cell=>fetchCell(cell,signal)));
    for(const data of results)for(const feature of data.features)features.set(String(feature.id ?? feature.properties?.id),feature);
   }
   if(signal.aborted||token!==generation)return;
   await (m.getSource(source) as GeoJSONSource).setData({type:'FeatureCollection',features:[...features.values()]});
   await ready(m,source,signal,true);
   if(signal.aborted||token!==generation)return;
   active=true;paint();
   const unknown=[...features.values()].filter(f=>f.properties?.height==null).length;
   report(`Overture · ${region.name} pilot${partial?' · partial view; buildings beyond the pilot are not shown':''}. ${unknown.toLocaleString()} loaded footprints have unknown heights. Coverage is not a complete inventory.`);
  }catch(error){if(!signal.aborted && token===generation)fallback(`Overture unavailable; showing OpenStreetMap buildings. ${error instanceof Error?error.message:'Try again after moving the map.'}`);}
 };
 const cancel=()=>{request?.abort();generation++;clearTimeout(timer);};
 const schedule=()=>{clearTimeout(timer);if(enabled)timer=setTimeout(update,180);};
 m.on('movestart',cancel);m.on('moveend',schedule);
 return {
  setEnabled(value:boolean){if(enabled===value)return;enabled=value;cancel();if(value)schedule();else{paint();report('');}},
  setOpacity(value:number){opacity=value;paint();},
  dispose(){cancel();m.off('movestart',cancel);m.off('moveend',schedule);if(m.getLayer(layer))m.removeLayer(layer);if(m.getSource(source))m.removeSource(source);},
 };
}
