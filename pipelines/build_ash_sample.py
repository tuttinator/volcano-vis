"""Calibrate HSD bands with Satpy and render its documented AHI Ash RGB recipe."""
from pathlib import Path
import json,hashlib
import numpy as np
from PIL import Image
from satpy import Scene
from pyresample import create_area_def
from pyproj import Transformer
ROOT=Path(__file__).resolve().parents[1]
BOUNDS=[101,-9,109,-2];WIDTH=640;HEIGHT=564

def build():
    manifest_path=ROOT/'public/data/ash-rgb.json'
    if manifest_path.exists() and 'expectedClockSlots' in json.loads(manifest_path.read_text()):
        raise SystemExit('An event archive already exists. Use build_ash_archive.py to resume it; the sample command cannot replace it.')
    sources=json.loads((ROOT/'data/raw/ahi-ash/sources.json').read_text())
    transformer=Transformer.from_crs(4326,3857,always_xy=True)
    w,s=transformer.transform(*BOUNDS[:2]);e,n=transformer.transform(*BOUNDS[2:])
    area=create_area_def('sunda-strait-ash','EPSG:3857',width=WIDTH,height=HEIGHT,area_extent=(w,s,e,n))
    frames=[]
    target=ROOT/'public/data/ash-rgb';target.mkdir(exist_ok=True)
    for time in sorted({s['time'] for s in sources}):
        inputs=[s for s in sources if s['time']==time]
        frame=render_frame(time,inputs,area,target)
        frames.append(frame);print(time,frame['validPixelFraction'],frame['temperatureRange'],flush=True)
    manifest={'provider':'Derived locally from JMA Himawari-9 HSD / NOAA Open Data','layer':'AHI Ash RGB (Satpy recipe)','start':frames[0]['sourceTime'],'end':frames[-1]['sourceTime'],'bounds':BOUNDS,'width':WIDTH,'height':HEIGHT,'crs':'EPSG:3857','frames':frames,'recipe':{'red':'(BT15 - BT13 + 4) / 6','green':'(BT14 - BT11 + 4) / 9','blue':'(BT13 - 243) / 60','units':'kelvin','gamma':1,'scaling':'Clip each channel to [0,1], multiply by 255 and round. Missing pixels transparent.','calibration':'Satpy 0.60.0 ahi_hsd brightness_temperature','resampling':'nearest neighbour; 5000 m radius; no temporal interpolation','references':['https://github.com/pytroll/satpy/blob/v0.60.0/satpy/etc/composites/ahi.yaml','https://github.com/pytroll/satpy/blob/v0.60.0/satpy/etc/enhancements/generic.yaml']},'limitations':'Three-scan feasibility sample only. Ash RGB assists interpretation but is not an ash mask, concentration measurement or cloud-top-height retrieval. Cloud cover and mixed pixels affect colours. Nominal full-disk timestamps are not per-pixel acquisition times.','attribution':'Created locally from Japan Meteorological Agency Himawari-9 data accessed through NOAA Open Data. Not an official JMA image product.','termsUrl':'https://www.jma.go.jp/jma/en/copyright.html'}
    (ROOT/'public/data/ash-rgb.json').write_text(json.dumps(manifest,indent=2)+'\n')

def render_frame(time,inputs,area,target):
    scene=Scene(reader='ahi_hsd',filenames=[str(ROOT/s['path']) for s in inputs])
    scene.load(['B11','B13','B14','B15'],calibration='brightness_temperature')
    scene=scene.crop(ll_bbox=(100.9,-9.1,109.1,-1.9))
    resampled=scene.resample(area,resampler='nearest',radius_of_influence=5000)
    from dask import compute
    bands=['B11','B13','B14','B15']
    arrays=compute(*(resampled[b].data for b in bands))
    values=dict(zip(bands,arrays))
    assert all(resampled[b].attrs['units']=='K' for b in values)
    # Satpy 0.60.0 AHI ash + generic ash_default enhancement, gamma 1.
    channels=[(values['B15']-values['B13']+4)/6,(values['B14']-values['B11']+4)/9,(values['B13']-243)/60]
    valid=np.logical_and.reduce([np.isfinite(v) for v in values.values()])
    rgba=np.zeros((HEIGHT,WIDTH,4),dtype=np.uint8)
    rgba[:,:,:3]=np.nan_to_num(np.clip(np.stack(channels,axis=-1),0,1)*255).round().astype(np.uint8)
    rgba[:,:,3]=valid.astype(np.uint8)*255
    filename=time.replace('-','').replace(':','')+'.png';path=target/filename
    Image.fromarray(rgba).save(path)
    stats={b:{'minKelvin':float(np.nanmin(v)),'maxKelvin':float(np.nanmax(v))} for b,v in values.items()}
    frame={'time':int(__import__('datetime').datetime.fromisoformat(time).timestamp()*1000),'sourceTime':time,'url':'/data/ash-rgb/'+filename,'sourceUrl':inputs[0]['url'],'sha256':hashlib.sha256(path.read_bytes()).hexdigest(),'bytes':path.stat().st_size,'inputs':inputs,'validPixelFraction':float(valid.mean()),'temperatureRange':stats}
    return frame

if __name__=='__main__':build()
