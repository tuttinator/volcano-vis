"""Resume a complete event Ash RGB build, preserving input provenance per scan."""
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime,timedelta,timezone
import argparse,bz2,hashlib,json,urllib.request,urllib.error,time,warnings
from build_ash_sample import ROOT,BOUNDS,WIDTH,HEIGHT,render_frame
from pyresample import create_area_def
from pyproj import Transformer
START=datetime(2026,9,4,15,tzinfo=timezone.utc);END=datetime(2026,9,8,17,tzinfo=timezone.utc)
BANDS=['11','13','14','15'];RAW=ROOT/'data/raw/ahi-ash';TARGET=ROOT/'public/data/ash-rgb'
MANIFEST=ROOT/'public/data/ash-rgb.json'
class SourceMissing(Exception):pass

def fetch_band(pair):
    stamp,band=pair;d=datetime.fromisoformat(stamp)
    name=f'HS_H09_{d:%Y%m%d_%H%M}_B{band}_FLDK_R20_S0610.DAT.bz2'
    url=f'https://noaa-himawari9.s3.amazonaws.com/AHI-L1b-FLDK/{d:%Y/%m/%d/%H%M}/{name}';path=RAW/name
    if path.exists():raw=path.read_bytes();bz2.decompress(raw)
    else:
        for attempt in range(3):
            try:
                with urllib.request.urlopen(url,timeout=60) as response:raw=response.read()
                bz2.decompress(raw);temp=path.with_suffix('.part');temp.write_bytes(raw);temp.replace(path);break
            except urllib.error.HTTPError as e:
                if e.code==404:raise SourceMissing(url) from e
                if attempt==2:raise
                time.sleep(attempt+1)
            except Exception:
                if attempt==2:raise
                time.sleep(attempt+1)
    return {'time':stamp,'band':f'B{band}','url':url,'path':str(path.relative_to(ROOT)),'sha256':hashlib.sha256(raw).hexdigest(),'bytes':len(raw)}

def main(limit=None):
    data=json.loads(MANIFEST.read_text());frames={f['sourceTime']:f for f in data['frames']}
    for stamp,frame in list(frames.items()):
        path=ROOT/('public'+frame['url'])
        if not path.exists() or hashlib.sha256(path.read_bytes()).hexdigest()!=frame['sha256']:del frames[stamp]
    missing={r['time']:r for r in data.get('missingSourceScans',[])};failed={}
    stamps=[];t=START
    while t<=END:stamps.append(t.isoformat().replace('+00:00','Z'));t+=timedelta(minutes=10)
    data.update({'start':stamps[0],'end':stamps[-1],'expectedClockSlots':len(stamps),'complete':False,'limitations':'Ash RGB assists interpretation but is not an ash mask, concentration measurement or cloud-top-height retrieval. Clouds, viewing angle and mixed pixels affect colours. Nominal scan times are not per-pixel acquisition times.'})
    transform=Transformer.from_crs(4326,3857,always_xy=True);w,s=transform.transform(*BOUNDS[:2]);e,n=transform.transform(*BOUNDS[2:])
    area=create_area_def('sunda-strait-ash','EPSG:3857',width=WIDTH,height=HEIGHT,area_extent=(w,s,e,n))
    def save():
        data['frames']=sorted(frames.values(),key=lambda f:f['time']);data['missingSourceScans']=sorted(missing.values(),key=lambda r:r['time']);data['failedScans']=sorted(failed.values(),key=lambda r:r['time'])
        data['processedClockSlots']=len(frames)+len(missing)+len(failed);data['complete']=len(frames)+len(missing)==len(stamps) and not failed
        temp=MANIFEST.with_suffix('.tmp');temp.write_text(json.dumps(data,indent=2)+'\n');temp.replace(MANIFEST)
    pending=[t for t in stamps if t not in frames and t not in missing]
    if limit is not None:pending=pending[:limit]
    save()
    # Four band fetches at once; at most two scans downloaded ahead of rendering.
    with ThreadPoolExecutor(max_workers=4) as bands:
        jobs={}
        def schedule(stamp):jobs[stamp]=[bands.submit(fetch_band,(stamp,b)) for b in BANDS]
        for stamp in pending[:2]:schedule(stamp)
        for i,stamp in enumerate(pending):
            try:
                inputs=[];errors=[]
                for future in jobs.pop(stamp):
                    try:inputs.append(future.result())
                    except Exception as exc:errors.append(exc)
                if errors:raise errors[0]
                with warnings.catch_warnings():
                    warnings.filterwarnings('ignore',message='invalid value encountered in log',category=RuntimeWarning)
                    frame=render_frame(stamp,inputs,area,TARGET)
                if frame['validPixelFraction']<0.99:raise ValueError(f'Incomplete spatial coverage: {frame["validPixelFraction"]}')
                frames[stamp]=frame
            except SourceMissing as exc:missing[stamp]={'time':stamp,'reason':'Source band returned HTTP 404','sourceUrl':str(exc)}
            except Exception as exc:failed[stamp]={'time':stamp,'error':str(exc)}
            save()
            if i+2<len(pending):schedule(pending[i+2])
            print(f'{len(frames)} frames, {len(missing)} absent, {len(failed)} failed / {len(stamps)} slots; {stamp}',flush=True)
    save()
if __name__=='__main__':
    parser=argparse.ArgumentParser();parser.add_argument('--limit',type=int);main(parser.parse_args().limit)
