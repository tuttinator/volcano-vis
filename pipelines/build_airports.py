"""Convert official airport reference points from retained DGCA profiles."""
from pathlib import Path
import re,json,html,hashlib
ROOT=Path(__file__).resolve().parents[1]
PROFILES={'soekarno-hatta':222,'halim':122,'radin-inten':258,'budiarto':102,'pondok-cabe':482,'husein':242,'salakanagara':304,'muhammad-taufiq-kiemas':273}
def build():
    names={a['id']:a['name'] for a in json.loads((ROOT/'public/data/chronology.json').read_text())['airports']}
    records=[]
    for id,profile in PROFILES.items():
        path=ROOT/f'data/raw/airports/{id}.html';raw=path.read_text()
        text=html.unescape(re.sub('<[^>]+>',' ',raw));text=' '.join(text.split())
        arp=re.search(r'Koordinat ARP (.*?) (?:Data Umum|Informasi Umum)',text)[1]
        parts=re.findall(r'(\d+)°\s*(\d+)\s*\'\s*([\d.]+)"\s*(LS|LU|BT|BB)',arp)
        assert len(parts)==2,(id,arp)
        values=[(int(d)+int(m)/60+float(s)/3600)*(-1 if direction in ['LS','BB'] else 1) for d,m,s,direction in parts]
        records.append({'id':id,'name':names[id],'coordinates':[values[1],values[0]],'sourceCoordinates':arp,'sourceUrl':f'https://hubud.kemenhub.go.id/bandara/{profile}','sourcePath':str(path.relative_to(ROOT)),'sha256':hashlib.sha256(path.read_bytes()).hexdigest(),'markerKind':'airport'})
    (ROOT/'public/data/airports.json').write_text(json.dumps({'provider':'DGCA / Kementerian Perhubungan','retrievedAt':'2026-09-12','unresolved':['atungbusu'],'airports':records},indent=2)+'\n')
    print(f'{len(records)} official airport reference points')
if __name__=='__main__':build()
