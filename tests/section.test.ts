import {test} from 'node:test';
import assert from 'node:assert/strict';
import {longitudeIntervals} from '../apps/web/src/lib/section.ts';
test('transect preserves disjoint intersections in concave polygons',()=>{
 const ring=[[0,0],[3,0],[3,3],[2,3],[2,1],[1,1],[1,3],[0,3],[0,0]];
 assert.deepEqual(longitudeIntervals(ring,2),[[0,1],[2,3]]);
 assert.deepEqual(longitudeIntervals([...ring].reverse(),2),[[0,1],[2,3]]);
 assert.deepEqual(longitudeIntervals(ring,.5),[[0,3]]);
});
test('transect handles vertices and absent intersections without spurious zero-width ranges',()=>{
 const triangle=[[0,0],[2,2],[4,0],[0,0]];
 assert.deepEqual(longitudeIntervals(triangle,1),[[1,3]]);
 assert.deepEqual(longitudeIntervals(triangle,2),[]);
 assert.deepEqual(longitudeIntervals(triangle,3),[]);
 assert.deepEqual(longitudeIntervals([],1),[]);
});
