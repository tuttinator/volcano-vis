import {useEffect,useMemo,useState} from 'react';
import {MapView} from './Map';
import {assetUrl} from './lib/assets';
import {airportEvidenceAt,type Chronology} from './data/event';
import type {AshComponent} from './data/types';
type AirportPoint={id:string;name:string;coordinates:[number,number];markerKind:'airport';sourceUrl:string;sourceCoordinates:string};
const empty:AshComponent[]=[];
export function AirportMap({chronology,time,assetPath,fallbackBounds}:{chronology:Chronology;time:number;assetPath:string;fallbackBounds:[number,number,number,number]}){
 const [points,setPoints]=useState<AirportPoint[]>([]),[selected,setSelected]=useState(''),[error,setError]=useState('');
 useEffect(()=>{setPoints([]);setSelected('');setError('');const controller=new AbortController();fetch(assetUrl(assetPath),{signal:controller.signal}).then(r=>{if(!r.ok)throw Error('Airport locations could not load.');return r.json();}).then(d=>setPoints(d.airports)).catch(e=>{if(e.name!=='AbortError')setError(e.message);});return()=>controller.abort();},[assetPath]);
 const reportedPoints=useMemo(()=>points.filter(p=>chronology.airports.some(a=>a.id===p.id)),[points,chronology.airports]);
 const unmapped=chronology.airports.filter(a=>!reportedPoints.some(p=>p.id===a.id));
 const bounds=useMemo(()=>{if(!reportedPoints.length)return fallbackBounds;const xs=reportedPoints.map(p=>p.coordinates[0]),ys=reportedPoints.map(p=>p.coordinates[1]);return [Math.min(...xs)-.5,Math.min(...ys)-.5,Math.max(...xs)+.5,Math.max(...ys)+.5] as [number,number,number,number];},[reportedPoints,fallbackBounds]);
 const point=reportedPoints.find(p=>p.id===selected),report=chronology.airports.find(a=>a.id===selected),state=report?airportEvidenceAt(report,chronology,time):'unknown';
 return <section className="airport-location-map"><h3>Airports named in the reports</h3><p>{reportedPoints.length} report locations have sourced airport reference points. {unmapped.length>0&&<>No verified location is supplied for {unmapped.map(a=>a.name).join(', ')}. </>} A location marker does not establish ash exposure or operating status.</p>{error?<p role="status">{error}</p>:reportedPoints.length>0&&<div className="map-card"><MapView records={empty} volcanoes={reportedPoints} selectedId={selected} eventBounds={bounds} onSelectVolcano={setSelected}/><div className="map-credit">DGCA / Kementerian Perhubungan · Natural Earth</div></div>}<label>Inspect airport location<select aria-label="Inspect airport location" value={selected} onChange={e=>setSelected(e.target.value)}><option value="">Select an airport</option>{reportedPoints.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select></label>{point&&report&&<div className="airport-map-detail" role="status"><strong>{point.name}</strong><p>{state==='scheduled-closure'?'Inside the reported scheduled closure window.':state==='reopening-reported'?'Reopening has been reported by this time.':'Operating status is not established at the selected time.'} {report.notes}</p><a href={point.sourceUrl} target="_blank" rel="noreferrer">Official location source ↗</a><p>Reference point: {point.sourceCoordinates}</p></div>}</section>;
}
