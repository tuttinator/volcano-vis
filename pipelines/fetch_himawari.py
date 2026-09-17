"""Download available ten-minute GIBS Himawari IR browse frames, resumably."""
from pathlib import Path
from datetime import datetime, timezone, timedelta
import concurrent.futures, hashlib, json, math, time, urllib.parse, urllib.request, xml.etree.ElementTree as ET
ROOT=Path(__file__).resolve().parents[1]
LAYER='Himawari_AHI_Band13_Clean_Infrared'
START='2026-09-04T15:00:00Z'; END='2026-09-08T17:00:00Z'
BOUNDS=[101,-9,109,-2]
def dt(s):return datetime.fromisoformat(s.replace('Z','+00:00'))
def stamp(d):return d.isoformat(timespec='seconds').replace('+00:00','Z')
def available_times():
    layer=next(l for l in ET.parse(ROOT/'data/raw/gibs-capabilities.xml').iter('Layer') if l.findtext('Name')==LAYER)
    intervals=[]
    for value in layer.findtext('Extent').split(','):
        parts=value.split('/');intervals.append((dt(parts[0]),dt(parts[1]) if len(parts)>1 else dt(parts[0])))
    times=[];missing=[];t=dt(START)
    while t<=dt(END):
        (times if any(a<=t<=b and (t-a).total_seconds()%600==0 for a,b in intervals) else missing).append(stamp(t));t+=timedelta(minutes=10)
    return times,missing

def fetch(at):
    x0,y0,x1,y1=BOUNDS
    def x(lon):return 6378137*math.radians(lon)
    def y(lat):return 6378137*math.log(math.tan(math.pi/4+math.radians(lat)/2))
    args={'SERVICE':'WMS','VERSION':'1.1.1','REQUEST':'GetMap','LAYERS':LAYER,'STYLES':'','FORMAT':'image/png','SRS':'EPSG:3857','BBOX':','.join(map(str,[x(x0),y(y0),x(x1),y(y1)])),'WIDTH':640,'HEIGHT':564,'TIME':at}
    url='https://gibs.earthdata.nasa.gov/wms/epsg3857/best/wms.cgi?'+urllib.parse.urlencode(args)
    name=at.replace(':','').replace('-','')+'.png';path=ROOT/'public/data/himawari'/name
    try:
        if not path.exists():
            for attempt in range(3):
                try:
                    with urllib.request.urlopen(url,timeout=35) as response:content=response.read()
                    if not content.startswith(b'\x89PNG\r\n\x1a\n'):raise ValueError('Provider did not return PNG')
                    path.write_bytes(content);break
                except Exception:
                    if attempt==2:raise
                    time.sleep(attempt+1)
        content=path.read_bytes()
        return {'time':int(dt(at).timestamp()*1000),'sourceTime':at,'url':'/data/himawari/'+name,'sourceUrl':url,'sha256':hashlib.sha256(content).hexdigest(),'bytes':len(content)}
    except Exception as e:return {'sourceTime':at,'error':str(e)}

if __name__=='__main__':
    times,missing=available_times();frames=[];failed=[]
    out=ROOT/'public/data/himawari.json';out.parent.mkdir(exist_ok=True);(out.parent/'himawari').mkdir(exist_ok=True)
    def save():
        result={'layer':LAYER,'provider':'NASA GIBS / Himawari AHI','start':START,'end':END,'bounds':BOUNDS,'crs':'EPSG:3857','width':640,'height':564,'nominalIntervalMinutes':10,'timeMeaning':'Nominal source scan time; individual pixels are not necessarily acquired at this exact instant.','limitations':'Band 13 infrared brightness-temperature browse imagery. Not Ash RGB, an ash mask, or an ash-concentration measurement.','retrievedAt':'2026-09-12','frames':sorted(frames,key=lambda f:f['time']),'unavailableTimes':missing,'failedRequests':failed,'complete':len(frames)+len(failed)==len(times),'expectedAvailableFrames':len(times)}
        temp=out.with_suffix('.tmp');temp.write_text(json.dumps(result,indent=2)+'\n');temp.replace(out)
    print(f'Fetching {len(times)} available frames; {len(missing)} published gaps.',flush=True)
    with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:
        for i,result in enumerate(pool.map(fetch,times),1):
            (failed if 'error' in result else frames).append(result)
            if i%20==0:save();print(f'{i}/{len(times)} processed; {len(failed)} failed',flush=True)
    save();print(f'Complete: {len(frames)} frames, {len(missing)} source gaps, {len(failed)} failed requests.',flush=True)
