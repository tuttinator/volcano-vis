"""Preserve all rows of PVMBG's dated classification table without inferring activity."""
from pathlib import Path
import json,re,html,hashlib
ROOT=Path(__file__).resolve().parents[1]
SOURCE=ROOT/'data/raw/magma-volcano-types.html'
URL='https://magma.esdm.go.id/v1/edukasi/tipe-gunung-api-di-indonesia-a-b-dan-c'
def build():
    records=[]
    links={'Merapi':'263250','Anak Krakatau':'262000','Semeru':'263300','Ili Lewotolok':'264230','Dukono':'268010','Ibu':'268030'}
    for row in re.findall(r'<tr\b[^>]*>(.*?)</tr>',SOURCE.read_text(),re.S):
        cells=[html.unescape(re.sub('<[^>]+>','',c)).strip() for c in re.findall(r'<td\b[^>]*>(.*?)</td>',row,re.S)]
        if not cells or cells[0] not in ('A','B','C'):continue
        kind,name,lat,lon,region=cells
        records.append({'id':re.sub(r'[^a-z0-9]+','-',f'{region}-{name}'.lower()).strip('-'),'name':name,'classification':kind,'coordinates':[float(lon),float(lat)],'region':region,'submarine':'(BL)' in name,'advisoryId':links.get(name)})
    assert len(records)==127 and len({r['id'] for r in records})==127
    output={'sourceUrl':URL,'provider':'PVMBG / MAGMA Indonesia','sourceUpdatedAt':'2021-09-20T12:01:09+07:00','retrievedAt':'2026-09-12','inputSha256':hashlib.sha256(SOURCE.read_bytes()).hexdigest(),'coverage':'All 127 entries in the source classification table; not an inventory of every extinct volcanic landform or current alert levels.','definitions':{'A':'Recorded eruption history since 1600.','B':'Recorded eruption history before 1600.','C':'No recorded eruption history, but signs of volcanic activity such as solfataras or fumaroles.'},'volcanoes':sorted(records,key=lambda v:(v['name'].lower(),v['region']))}
    (ROOT/'public/data/directory.json').write_text(json.dumps(output,indent=2)+'\n')
    print(f'{len(records)} official classification entries')
if __name__=='__main__':build()
