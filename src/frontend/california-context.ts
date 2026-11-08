import type { Map } from 'maplibre-gl';

// Generalized Census display geometry only. This never clips observations,
// filters facilities, or participates in exact address/tract membership.
export function installCaliforniaContext(map: Map) {
  const before = map.getStyle().layers.find(layer => layer.type === 'symbol')?.id;
  map.addSource('california-context', {
    type: 'geojson', data: '/ui/california-context.geojson', maxzoom: 8,
    attribution: '<a href="https://www.census.gov/geographies/mapping-files/2024/geo/carto-boundary-file.html">California context: U.S. Census Bureau</a>',
  });
  map.addLayer({
    id: 'california-surroundings', type: 'fill', source: 'california-context', maxzoom:10,
    filter: ['==',['get','kind'],'outside'],
    paint: {
      'fill-color': '#02080d',
      'fill-opacity': ['interpolate',['linear'],['zoom'],3,.34,6,.26,8,.10,10,0],
      'fill-antialias': false,
    },
  },before);
  map.addLayer({
    id:'california-outline-glow',type:'line',source:'california-context',maxzoom:10,
    filter:['==',['get','kind'],'california'],
    paint:{'line-color':'#8eb8bd','line-width':7,'line-blur':4,
      'line-opacity':['interpolate',['linear'],['zoom'],3,.12,6,.22,8,.1,10,0]},
  },before);
  map.addLayer({
    id:'california-outline',type:'line',source:'california-context',maxzoom:10,
    filter:['==',['get','kind'],'california'],
    paint:{'line-color':'#91b9bd',
      'line-width':['interpolate',['linear'],['zoom'],3,1,6,1.5,10,1],
      'line-opacity':['interpolate',['linear'],['zoom'],3,.6,6,.85,8,.45,10,0]},
  },before);
  if(map.getLayer('label_state'))map.setPaintProperty('label_state','text-color',[
    'case',['==',['coalesce',['get','name:latin'],['get','name']],'California'],'#d3e6e8','#88969f',
  ]);
}
