import type {Product,AshComponent} from '../data/types';
import {MINUTE} from './time';
export type ReplayAdvisory={product:Product;components:AshComponent[];mode:'initial'|'forecast';ageMinutes:number;status:'geometry'|'not-available'|'no-ash-expected'|'not-identifiable'};
export function replayAdvisories(products:Product[],time:number):ReplayAdvisory[]{
 const revisions=new Map<string,Product>();
 for(const p of products){if(p.issuedAt>time)continue;const previous=revisions.get(p.productId);if(!previous||p.issuedAt>previous.issuedAt)revisions.set(p.productId,p);}
 const eligible=[...revisions.values()];
 const initial=eligible.filter(p=>p.observedAt<=time).sort((a,b)=>b.observedAt-a.observedAt||b.issuedAt-a.issuedAt)[0];
 const result:ReplayAdvisory[]=[];
 if(initial&&time<initial.observedAt+60*MINUTE)result.push({product:initial,components:initial.components.filter(c=>c.leadHours===0),mode:'initial',status:initial.leadStates['0'].status,ageMinutes:(time-initial.observedAt)/MINUTE});
 const forecast=eligible.filter(p=>Object.entries(p.leadStates).some(([lead,state])=>Number(lead)>0&&state.validAt===time)).sort((a,b)=>b.issuedAt-a.issuedAt)[0];
 if(forecast)result.push({product:forecast,components:forecast.components.filter(c=>c.leadHours>0&&c.validAt===time),mode:'forecast',status:Object.entries(forecast.leadStates).find(([lead,state])=>Number(lead)>0&&state.validAt===time)![1].status,ageMinutes:0});
 return result;
}
export function advisoryInstants(products:Product[]):number[]{
 return [...new Set(products.flatMap(p=>[p.issuedAt,p.observedAt,p.observedAt+60*MINUTE,...Object.values(p.leadStates).map(s=>s.validAt)]))].sort((a,b)=>a-b);
}
