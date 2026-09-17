"""Rebuild source-backed static assets from preserved factual source inputs."""
from pathlib import Path
from datetime import datetime, timezone, timedelta
import json, re, hashlib, html
ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT/'data/raw/darwin-factual-extract-2026-09-12.json'

def coordinate(lat, lon):
    def number(s):
        digits=s[1:]; degrees=int(digits[:-2]); minutes=int(digits[-2:])
        if minutes>=60: raise ValueError(f'Invalid minutes: {s}')
        return round((degrees+minutes/60)*(-1 if s[0] in 'SW' else 1),6)
    return [number(lon),number(lat)]

def timestamp(raw, issue=None):
    if re.fullmatch(r'\d{8}/\d{4}Z',raw):
        return int(datetime.strptime(raw,'%Y%m%d/%H%MZ').replace(tzinfo=timezone.utc).timestamp()*1000)
    match=re.match(r'(\d{2})/(\d{2})(\d{2})Z',raw)
    if not match or issue is None: raise ValueError(f'Invalid timestamp: {raw}')
    day,hour,minute=map(int,match.groups());base=datetime.fromtimestamp(issue/1000,timezone.utc)
    candidates=[]
    for offset in (-1,0,1):
        month=base.month+offset;year=base.year
        if month==0: month=12;year-=1
        if month==13: month=1;year+=1
        try:candidates.append(datetime(year,month,day,hour,minute,tzinfo=timezone.utc))
        except ValueError:pass
    return int(min(candidates,key=lambda d:abs((d-base).total_seconds())).timestamp()*1000)

def parse_geometry(value):
    if 'VA NOT IDENTIFIABLE' in value:return []
    components=[]
    for match in re.finditer(r'(SFC|FL\d{3})/(FL\d{3})(.*?)(?=(?:SFC|FL\d{3})/FL\d{3}|$)',value):
        low,high,body=match.groups()
        points=[coordinate(*pair) for pair in re.findall(r'([NS]\d{4})\s+([EW]\d{5})',body)]
        if len(points)<3: raise ValueError(f'Incomplete polygon: {value}')
        if points[-1]!=points[0]:points.append(points[0])
        components.append({'lower':0 if low=='SFC' else int(low[2:]),'upper':int(high[2:]),'coordinates':points})
    return components

def gdacs_records(filename='gdacs-krakatau-gts.html',event_id='1000148'):
    """Extract TAC fields; GDACS repeats some line suffixes in its HTML rendering."""
    path=ROOT/'data/raw'/filename
    url=f'https://data.gdacs.org/gts.aspx?eventid={event_id}&eventtype=VO'
    rows=[]
    for block in re.findall(r'<pre_gts[^>]*>(.*?)</pre_gts>',path.read_text(),re.S):
        fields={}; key=None
        for line in html.unescape(re.sub(r'<[^>]+>','\n',block)).splitlines():
            line=' '.join(line.split())
            match=re.match(r'^([A-Z][A-Z0-9 +/]*):\s*(.*)',line)
            if match:
                key,value=match.groups();fields[key]=value
            elif key and line and not fields[key].endswith(line):
                fields[key]+=' '+line
        if 'VOLCANO' not in fields:continue
        remarks=fields.get('RMK','').upper()
        rows.append({'fields':fields,'sourceLine':0,'sourceUrl':url,
          'flags':{'cloudObscured':'OBSCUR' in remarks,'lowForecastConfidence':'LOW CONFIDENCE' in remarks,'correction':bool(re.search(r'CORRECT(?:ION|ED)',block.upper()))}})
    return rows

def build():
    raw=json.loads(SOURCE.read_text()); products=[]; volcanoes={}
    seen=set()
    historical=[r for r in gdacs_records('gdacs-semeru-2025-gts.html','1000125') if re.match(r'202511(?:19|20|21|22|23|24)/',r['fields']['DTG'])]
    merapi=gdacs_records('gdacs-merapi-2023-gts.html','1000062')
    for row in raw['records']+gdacs_records()+historical+merapi:
        f=row['fields'];name,volcano_id=f['VOLCANO'].rsplit(' ',1)
        issue=timestamp(f['DTG']); identity=(volcano_id,f['ADVISORY NR'],issue)
        if identity in seen:continue
        seen.add(identity)
        estimate='EST VA DTG' in f; prefix='EST' if estimate else 'OBS'
        at=timestamp(f[prefix+' VA DTG'],issue)
        position=coordinate(*f['PSN'].split())
        volcanoes[volcano_id]={'id':volcano_id,'name':name.title(),'coordinates':position,'elevationMeters':int(re.search(r'\d+',f.get('SOURCE ELEV',f.get('SUMMIT ELEV')))[0])}
        product_id=f'DARWIN/{volcano_id}/{f["ADVISORY NR"]}'
        parts=[];lead_states={}
        for lead in (0,6,12,18):
            field=f[prefix+' VA CLD'] if lead==0 else f[f'FCST VA CLD +{lead} HR']
            valid=at if lead==0 else timestamp(field,issue)
            components=parse_geometry(field)
            status='geometry' if components else 'not-identifiable' if 'VA NOT IDENTIFIABLE' in field else 'not-available' if 'NOT AVBL' in field else 'no-ash-expected' if 'NO VA EXP' in field else None
            if status is None:raise ValueError(f'Unsupported geometry state: {field}')
            lead_states[str(lead)]={'validAt':valid,'status':status}
            for i,component in enumerate(components):
                parts.append({**component,'id':f'{product_id}/{issue}/{lead}/{i}','leadHours':lead,'validAt':valid,'kind':'forecast' if lead else 'estimated' if estimate else 'observed'})
        products.append({'id':f'{product_id}/{issue}','productId':product_id,'number':f['ADVISORY NR'],'volcanoId':volcano_id,'issuedAt':issue,'observedAt':at,'estimated':estimate,'components':parts,'leadStates':lead_states,'flags':row['flags'],'sourceUrl':row.get('sourceUrl',raw['sourceUrl']),'sourceLine':row['sourceLine']})
    products.sort(key=lambda p:p['issuedAt'])
    for p in products:
        family=[q for q in products if q['productId']==p['productId']]
        p['revision']=family.index(p)
        p['supersededBy']=next((q['id'] for q in family if q['issuedAt']>p['issuedAt']),None)
    names={'263250':('Merapi','Central Java / Yogyakarta','Asia/Jakarta'),'262000':('Anak Krakatau','Sunda Strait','Asia/Jakarta'),'263300':('Semeru','East Java','Asia/Jakarta'),'264230':('Lewotolok','Lembata','Asia/Makassar'),'268010':('Dukono','North Maluku','Asia/Jayapura'),'268030':('Ibu','North Maluku','Asia/Jayapura')}
    for v in volcanoes.values():
        v['name'],v['region'],v['timeZone']=names[v['id']]
        available=[p for p in products if p['volcanoId']==v['id'] and not p['supersededBy']]
        v['window']={'start':available[0]['issuedAt'],'end':available[-1]['issuedAt'],
            'label':'5 September eruption episode' if v['id']=='262000' else 'Available advisory sequence',
            'basis':'event' if v['id']=='262000' else 'archive',
            'notes':'Start on 5 September local time. The earliest retained advisory is 13:30 WIB; morning editions are not yet recovered.' if v['id']=='262000' else 'This sequence starts with the earliest retained advisory for this volcano, not a verified eruption onset. An event-specific historical window remains to be sourced.'}
        if v['id']=='262000':v['window']['preferredStart']=timestamp('20260904/1700Z')
    events=[]
    for v in volcanoes.values():
        subsets=[('2026-09', 'September 2026 advisory sequence', [p for p in products if p['volcanoId']==v['id'] and p['issuedAt']>=timestamp('20260901/0000Z')])]
        if v['id']=='263300':subsets.insert(0,('2025-11','19–24 November 2025 eruption',[p for p in products if p['volcanoId']==v['id'] and p['issuedAt']<timestamp('20260101/0000Z')]))
        if v['id']=='263250':subsets=[('2023-03','12–17 March 2023 advisory sequence',[p for p in products if p['volcanoId']==v['id']])]
        for key,label,subset in subsets:
            if not subset:continue
            window={**v['window'],'start':min(p['issuedAt'] for p in subset),'end':max(p['issuedAt'] for p in subset)}
            if key=='2025-11':window.update({'label':label,'basis':'event','notes':'Semeru eruption episode, 19–24 November 2025. The first retained issue is 16:46 WIB on 19 November; its three forecasts were explicitly unavailable.'})
            if key=='2023-03':window.update({'label':label,'basis':'archive','notes':'Merapi activity intensified on 11 March 2023. Retained advisories begin on 12 March at 22:50 WIB; this archive does not capture the initial onset.'})
            events.append({'id':v['id']+'-'+key,'volcanoId':v['id'],'label':label,**window})
        v['window']={k:events[-len(subsets)][k] for k in ['start','end','label','basis','notes']}
        if v['id']=='262000':v['window']['preferredStart']=timestamp('20260904/1700Z')
    catalog={'version':1,'retrievedAt':raw['retrievedAt'],'sourceUrl':raw['sourceUrl'],'inputSha256':hashlib.sha256(SOURCE.read_bytes()).hexdigest(),'archiveSha256':hashlib.sha256((ROOT/'data/raw/gdacs-krakatau-gts.html').read_bytes()).hexdigest(),'coverage':'Anak Krakatau: September 2026. Merapi: March 2023. Semeru: November 2025 and September 2026, selectable separately. Other volcanoes: available September sequences. Not a live feed.','volcanoes':sorted(volcanoes.values(),key=lambda v:v['coordinates'][0]),'products':products,'events':events,'merapiArchiveSha256':hashlib.sha256((ROOT/'data/raw/gdacs-merapi-2023-gts.html').read_bytes()).hexdigest(),'historicalArchiveSha256':hashlib.sha256((ROOT/'data/raw/gdacs-semeru-2025-gts.html').read_bytes()).hexdigest()}
    (ROOT/'public/data/catalog.json').write_text(json.dumps(catalog,indent=2)+'\n')
    land=json.loads((ROOT/'data/raw/ne_50m_land.geojson').read_text())
    # Keep whole Natural Earth polygons intersecting the region; no invented coastline.
    def intersects(feature):
        def coords(v):
            if isinstance(v[0],(int,float)):yield v
            else:
                for item in v:yield from coords(item)
        return any(65<=x<=142 and -30<=y<=15 for x,y in coords(feature['geometry']['coordinates']))
    subset={'type':'FeatureCollection','features':[f for f in land['features'] if intersects(f)]}
    (ROOT/'public/data/land.geojson').write_text(json.dumps(subset,separators=(',',':')))
    print(f'{len(products)} source editions, {len(volcanoes)} volcanoes, {sum(len(p["components"]) for p in products)} geometries')

if __name__=='__main__':build()
