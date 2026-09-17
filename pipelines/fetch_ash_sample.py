"""Fetch a three-scan Ash RGB feasibility sample from the public NOAA HSD archive."""
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor
import urllib.request,hashlib,json,bz2
ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'data/raw/ahi-ash';OUT.mkdir(exist_ok=True)
TIMES=['0400','0410','0420'];BANDS=['11','13','14','15']
def fetch(pair):
    time,band=pair;name=f'HS_H09_20260905_{time}_B{band}_FLDK_R20_S0610.DAT.bz2'
    url=f'https://noaa-himawari9.s3.amazonaws.com/AHI-L1b-FLDK/2026/09/05/{time}/{name}'
    path=OUT/name
    if not path.exists():
        with urllib.request.urlopen(url,timeout=90) as response:raw=response.read()
        bz2.decompress(raw);path.write_bytes(raw)
    raw=path.read_bytes();bz2.decompress(raw)
    print(f'Verified {time} B{band}',flush=True)
    return {'time':f'2026-09-05T{time[:2]}:{time[2:]}:00Z','band':f'B{band}','url':url,'path':str(path.relative_to(ROOT)),'sha256':hashlib.sha256(raw).hexdigest(),'bytes':len(raw)}
if __name__=='__main__':
    with ThreadPoolExecutor(max_workers=4) as pool:records=list(pool.map(fetch,[(t,b) for t in TIMES for b in BANDS]))
    (OUT/'sources.json').write_text(json.dumps(records,indent=2)+'\n')
