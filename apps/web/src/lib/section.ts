/** Even–odd intersections with an east–west transect. Vertices use a half-open rule. */
export function longitudeIntervals(ring:number[][],latitude:number):[number,number][]{
 const intersections:number[]=[];
 for(let i=0;i<ring.length;i++){
  const a=ring[i],b=ring[(i+1)%ring.length];
  if((a[1]>latitude)===(b[1]>latitude))continue;
  intersections.push(a[0]+(latitude-a[1])*(b[0]-a[0])/(b[1]-a[1]));
 }
 intersections.sort((a,b)=>a-b);
 const intervals:[number,number][]=[];
 for(let i=0;i+1<intersections.length;i+=2)if(intersections[i+1]-intersections[i]>1e-9)intervals.push([intersections[i],intersections[i+1]]);
 return intervals;
}
