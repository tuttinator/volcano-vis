"""Fetch dated GIBS browse images; preserves URLs, bounds and hashes, never infers an acquisition instant."""
from pathlib import Path
import concurrent.futures, hashlib, json, math, urllib.parse, urllib.request
ROOT=Path(__file__).resolve().parents[1]
LAYER='VIIRS_SNPP_CorrectedReflectance_TrueColor'

def mercator(lon,lat):return (6378137*math.radians(lon),6378137*math.log(math.tan(math.pi/4+math.radians(lat)/2)))
def fetch(job):
    volcano,date=job;x,y=volcano['coordinates'];bounds=[round(x-1.6,6),round(y-1.6,6),round(x+1.6,6),round(y+1.6,6)]
    west,south,east,north=bounds;projected=[*mercator(west,south),*mercator(east,north)]
    params={'SERVICE':'WMS','REQUEST':'GetMap','VERSION':'1.1.1','LAYERS':LAYER,'STYLES':'','FORMAT':'image/png','SRS':'EPSG:3857','BBOX':','.join(map(str,projected)),'WIDTH':768,'HEIGHT':768,'TIME':date}
    url='https://gibs.earthdata.nasa.gov/wms/epsg3857/best/wms.cgi?'+urllib.parse.urlencode(params)
    path=ROOT/f'public/data/imagery/{volcano["id"]}-{date}.png'
    if not path.exists():
        with urllib.request.urlopen(url,timeout=60) as r:content=r.read()
        if not content.startswith(b'\x89PNG\r\n\x1a\n'):raise ValueError(f'Not a PNG: {content[:100]}')
        path.write_bytes(content)
    return {'id':path.stem,'volcanoId':volcano['id'],'date':date,'timePrecision':'day','acquiredAt':None,'layer':LAYER,'provider':'NASA GIBS / Suomi NPP VIIRS','url':f'/data/imagery/{path.name}','sourceUrl':url,'bounds':bounds,'crs':'EPSG:3857','width':768,'height':768,'sha256':hashlib.sha256(path.read_bytes()).hexdigest(),'limitations':'Daily browse mosaic; exact overpass time is not supplied by this request. Clouds, haze and other features are not classified as ash.'}

if __name__=='__main__':
    catalog=json.loads((ROOT/'public/data/catalog.json').read_text())
    jobs=[(v,d) for v in catalog['volcanoes'] if v['id']!='263250' for d in ['2026-09-11','2026-09-12']]
    krakatau=next(v for v in catalog['volcanoes'] if v['id']=='262000')
    jobs += [(krakatau,d) for d in ['2026-09-05','2026-09-06','2026-09-07']]
    semeru=next(v for v in catalog['volcanoes'] if v['id']=='263300')
    jobs += [(semeru,f'2025-11-{day:02d}') for day in range(19,25)]
    merapi=next(v for v in catalog['volcanoes'] if v['id']=='263250')
    jobs += [(merapi,f'2023-03-{day:02d}') for day in range(11,18)]
    with concurrent.futures.ThreadPoolExecutor(max_workers=3) as pool:frames=list(pool.map(fetch,jobs))
    (ROOT/'public/data/imagery.json').write_text(json.dumps({'retrievedAt':'2026-09-12','frames':frames},indent=2)+'\n')
    print(f'Preserved {len(frames)} dated VIIRS image crops.')
