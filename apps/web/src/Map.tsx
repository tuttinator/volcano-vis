import { useEffect, useRef, useState } from 'react';
import * as maplibregl from 'maplibre-gl';
import type { GeoJSONSource } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import workerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url';
import type { AshComponent, Volcano, RasterFrame } from './data/types';
import {assetUrl} from './lib/assets';
maplibregl.setWorkerUrl(workerUrl);
type Props={extruded?:boolean;transectLatitude?:number;eventBounds?:[number,number,number,number];raster?:Pick<RasterFrame,'url'|'bounds'>;records:AshComponent[];volcanoes:(Pick<Volcano,'id'|'name'|'coordinates'>&{classification?:string;markerKind?:'airport'})[];selectedId:string;overview?:boolean;light?:boolean;onSelectVolcano?:(id:string)=>void;onSelect?:(id:string)=>void};
export function MapView({extruded=false,transectLatitude,records,raster,eventBounds,volcanoes,selectedId,overview=false,light=false,onSelectVolcano,onSelect}:Props){
 const bitmap=useRef<ImageBitmap|null>(null);const [rasterStatus,setRasterStatus]=useState(''),[displayedRaster,setDisplayedRaster]=useState<string|null>(null);
 const container=useRef<HTMLDivElement>(null),map=useRef<maplibregl.Map|null>(null);const [ready,setReady]=useState(false),[error,setError]=useState('');const callbacks=useRef({onSelectVolcano,onSelect});callbacks.current={onSelectVolcano,onSelect};
 useEffect(()=>{
  if(!container.current)return;
  let m:maplibregl.Map;
  try{m=new maplibregl.Map({container:container.current,center:[117,-3],zoom:4,minZoom:1,maxZoom:10,attributionControl:false,style:{version:8,sources:{},layers:[{id:'ocean',type:'background',paint:{'background-color':light?'#e3ebe8':'#152630'}}]}});}catch{setError('WebGL is unavailable. The source table and report details remain accessible.');return;}
  map.current=m;m.addControl(new maplibregl.NavigationControl({showCompass:false}),'bottom-right');
  m.on('error',e=>setError(`Map data could not load: ${e.error.message}`));
  m.on('load',()=>{
   m.addSource('land',{type:'geojson',data:assetUrl('/data/land.geojson'),attribution:'Natural Earth · public domain'});
   m.addLayer({id:'land',source:'land',type:'fill',paint:{'fill-color':light?'#f5f1e7':'#293d37','fill-outline-color':light?'#b6b8a7':'#53645b'}});
   const grid:GeoJSON.Feature[]=[];
   for(let x=90;x<=142;x+=2)grid.push({type:'Feature',properties:{},geometry:{type:'LineString',coordinates:[[x,-15],[x,10]]}});
   for(let y=-14;y<=10;y+=2)grid.push({type:'Feature',properties:{},geometry:{type:'LineString',coordinates:[[90,y],[142,y]]}});
   m.addSource('grid',{type:'geojson',data:{type:'FeatureCollection',features:grid}});m.addLayer({id:'grid',source:'grid',type:'line',paint:{'line-color':light?'#718477':'#8ca69b','line-opacity':.13}});
   m.addSource('ash',{type:'geojson',data:{type:'FeatureCollection',features:[]}});
   m.addLayer({id:'ash-fill',source:'ash',type:'fill',paint:{'fill-color':['match',['get','kind'],'forecast','#ddbd73','estimated','#b39ac5','#de9467'],'fill-opacity':.28}});
   m.addLayer({id:'ash-altitude',source:'ash',type:'fill-extrusion',layout:{visibility:'none'},paint:{'fill-extrusion-color':['match',['get','kind'],'forecast','#ddbd73','estimated','#b39ac5','#de9467'],'fill-extrusion-base':['get','lowerMeters'],'fill-extrusion-height':['get','upperMeters'],'fill-extrusion-opacity':.38,'fill-extrusion-vertical-gradient':true}});
   for(const kind of ['observed','estimated','forecast'])m.addLayer({id:`${kind}-line`,source:'ash',type:'line',filter:['==',['get','kind'],kind],paint:{'line-color':kind==='forecast'?'#c99e43':kind==='estimated'?'#a989b4':'#c36e41','line-width':2,...(kind==='observed'?{}:{'line-dasharray':kind==='forecast'?[4,3]:[1,2]})}});
   m.on('click','ash-fill',e=>{if(e.features?.[0])callbacks.current.onSelect?.(String(e.features[0].properties.id));});
   m.on('mouseenter','ash-fill',()=>{m.getCanvas().style.cursor='pointer';});m.on('mouseleave','ash-fill',()=>{m.getCanvas().style.cursor='';});
   for(const v of volcanoes){const interactive=Boolean(callbacks.current.onSelectVolcano);const el=document.createElement(interactive?'button':'div');el.className=`volcano-marker ${v.markerKind==='airport'?'airport-marker':''} ${light?'light':''} ${v.classification?`type-${v.classification}`:''}`;if(interactive)el.setAttribute('aria-label',v.markerKind==='airport'?`Inspect airport ${v.name}`:`Explore ${v.name}`);const icon=document.createElement('span');icon.setAttribute('aria-hidden','true');icon.textContent=v.markerKind==='airport'?'✈':'▲';const label=document.createElement('b');label.textContent=v.name;el.append(icon,label);el.onclick=()=>callbacks.current.onSelectVolcano?.(v.id);new maplibregl.Marker({element:el,anchor:'bottom'}).setLngLat(v.coordinates).addTo(m);}
   setReady(true);
  });
  return()=>{setReady(false);m.remove();map.current=null;bitmap.current?.close();bitmap.current=null;};
 },[light,volcanoes]);
 useEffect(()=>{
  if(!ready||!map.current)return;
  const m=map.current;const controller=new AbortController();let active=true;
  if(m.getLayer('satellite'))m.setLayoutProperty('satellite','visibility','none');
  setDisplayedRaster(null);
  if(!raster){setRasterStatus('');return;}
  setRasterStatus('Loading selected satellite image…');
  const [w,s,e,n]=raster.bounds;const coordinates:[[number,number],[number,number],[number,number],[number,number]]=[[w,n],[e,n],[e,s],[w,s]];
  fetch(assetUrl(raster.url),{signal:controller.signal}).then(response=>{if(!response.ok)throw Error(`HTTP ${response.status}`);return response.blob();}).then(createImageBitmap).then(next=>{
   if(!active){next.close();return;}
   if(!m.getSource('satellite')){m.addSource('satellite',{type:'image',coordinates});m.addLayer({id:'satellite',source:'satellite',type:'raster',layout:{visibility:'none'},paint:{'raster-opacity':.82,'raster-fade-duration':0}},'ash-fill');}
   const previous=bitmap.current;
   (m.getSource('satellite') as maplibregl.ImageSource).updateImage({image:next,coordinates});bitmap.current=next;previous?.close();
   m.setLayoutProperty('satellite','visibility','visible');setDisplayedRaster(raster.url);setRasterStatus('');
  }).catch(error=>{if(active&&error.name!=='AbortError')setRasterStatus(`Selected satellite image could not load (${error.message}). The image layer is cleared.`);});
  return()=>{active=false;controller.abort();};
 },[raster,ready]);
 useEffect(()=>{
  if(!ready||!map.current)return;
  (map.current.getSource('ash') as GeoJSONSource).setData({type:'FeatureCollection',features:records.map(r=>({type:'Feature',properties:{id:r.id,kind:r.kind,lowerMeters:r.lower*30.48,upperMeters:r.upper*30.48},geometry:{type:'Polygon',coordinates:[r.coordinates]}}))});
 },[records,ready]);
 useEffect(()=>{
  if(!ready||!map.current)return;const m=map.current;
  if(!m.getSource('transect')){m.addSource('transect',{type:'geojson',data:{type:'FeatureCollection',features:[]}});m.addLayer({id:'transect',type:'line',source:'transect',paint:{'line-color':'#e8e9e0','line-width':1.5,'line-dasharray':[6,4]}});}
  (m.getSource('transect') as GeoJSONSource).setData({type:'FeatureCollection',features:transectLatitude===undefined?[]:[{type:'Feature',properties:{},geometry:{type:'LineString',coordinates:[[65,transectLatitude],[142,transectLatitude]]}}]});
 },[ready,transectLatitude]);
 useEffect(()=>{
  if(!ready||!map.current)return;
  if(eventBounds){const [w,s,e,n]=eventBounds;map.current.fitBounds([[w,s],[e,n]],{padding:10,duration:0});return;}
  if(overview){map.current.fitBounds([[103,-10],[131,3]],{padding:40,duration:0});return;}
  const v=volcanoes.find(v=>v.id===selectedId);
  if(v){const points=[v.coordinates,...records.flatMap(r=>r.coordinates)];const xs=points.map(p=>p[0]),ys=points.map(p=>p[1]);map.current.fitBounds([[Math.min(...xs),Math.min(...ys)],[Math.max(...xs),Math.max(...ys)]],{padding:70,maxZoom:6.9,duration:0});}
 },[ready,selectedId,overview,volcanoes,eventBounds,records]);
 useEffect(()=>{
  if(!ready||!map.current)return;const m=map.current;
  m.setLayoutProperty('ash-altitude','visibility',extruded?'visible':'none');
  m.setLayoutProperty('ash-fill','visibility',extruded?'none':'visible');
  m.jumpTo({pitch:extruded?55:0,bearing:extruded?-15:0});
 },[ready,extruded,records,eventBounds]);
 return <div className="real-map" ref={container} data-raster-url={displayedRaster??undefined} aria-label="Map of Indonesian volcanoes and advisory ash geometry">{rasterStatus&&<p className="raster-transport-status" role="status">{rasterStatus}</p>}{error&&<p className="map-error" role="alert">{error}</p>}</div>;
}
