"""Build the replay's event configuration and source-linked timeline from retained catalogs."""
from pathlib import Path
import json
from datetime import datetime
ROOT=Path(__file__).resolve().parents[1]
def build():
    data=ROOT/'public/data'
    archive=json.loads((data/'himawari.json').read_text())
    chronology=json.loads((data/'chronology.json').read_text())
    event_id='anak-krakatau-2026-09'
    output=data/'events'/event_id
    output.mkdir(parents=True,exist_ok=True)
    event={'schemaVersion':1,'id':event_id,'volcanoId':chronology['volcanoId'],'title':'Anak Krakatau · September 2026','timeZone':'Asia/Jakarta','start':archive['start'],'end':archive['end'],'preferredStart':'2026-09-04T17:00:00Z','bounds':archive['bounds'],'assets':{'airports':'/data/airports.json','infrared':'/data/himawari.json','ashRgb':'/data/ash-rgb.json','timeline':f'/data/events/{event_id}/timeline.json','chronology':'/data/chronology.json'}}
    event['presentation']={'heading':'Four days, one shared clock.','description':'Himawari imagery and the documented Krakatau chronology, 4–8 September 2026.','place':'the Sunda Strait','timeZoneLabel':'WIB','advisoryCoverageNote':'Earlier morning editions are missing from this archive.','airportSummary':'BMKG reported NOTAMs issued by 08:30 WIB on 7 September, scheduling closure until 18:00. The next report lists reopening times. Exact closure starts are unavailable, and the two eight-airport lists differ.'}
    event['assets']['advisories']=f'/data/events/{event_id}/advisories.geojson'
    catalog=json.loads((data/'catalog.json').read_text())
    start=datetime.fromisoformat(event['start'].replace('Z','+00:00')).timestamp()*1000
    end=datetime.fromisoformat(event['end'].replace('Z','+00:00')).timestamp()*1000
    products=[p for p in catalog['products'] if p['volcanoId']==event['volcanoId'] and start<=p['issuedAt']<=end]
    features=[]
    for product in products:
        for component in product['components']:
            properties={k:v for k,v in component.items() if k not in ('coordinates','id')}
            properties.update({k:product[k] for k in ('productId','number','volcanoId','issuedAt','observedAt','estimated','sourceUrl','revision','supersededBy','flags')})
            properties['editionId']=product['id']
            features.append({'type':'Feature','id':component['id'],'geometry':{'type':'Polygon','coordinates':[component['coordinates']]},'properties':properties})
    advisories={'type':'FeatureCollection','eventId':event_id,'timeUnit':'Unix milliseconds UTC','altitudeUnit':'flight level (hundreds of feet)','selectionNote':'All recovered editions issued within the event window, including revisions and forecast targets outside the window. Features are source positions, not continuously valid areas. Use the application temporal selection rules. Empty lead assessments are preserved in editions.','editions':[{k:v for k,v in p.items() if k!='components'} for p in products],'features':features}
    (output/'advisories.geojson').write_text(json.dumps(advisories,indent=2)+'\n')
    event['assets']['airportStatus']=f'/data/events/{event_id}/airport-status.json'
    airport_status={'schemaVersion':1,'eventId':event_id,**{k:chronology[k] for k in ('airports','closureReport','sources','limitations')}}
    (output/'airport-status.json').write_text(json.dumps(airport_status,indent=2)+'\n')
    event['assets']['observations']=f'/data/events/{event_id}/observations.geojson'
    sources={s['id']:s for s in chronology['sources']}
    observations={'type':'FeatureCollection','eventId':event_id,'locationNote':'Report events retain null geometry because the retained chronology supplies no observation coordinates. Airport-wide statements are not assigned to individual airport points.','features':[{'type':'Feature','id':marker['id'],'geometry':None,'properties':{**marker,'volcanoId':event['volcanoId'],'sourceUrl':sources[marker['sourceId']]['url'],'sourcePublishedDate':sources[marker['sourceId']]['publishedDate']}} for marker in chronology['events']]}
    (output/'observations.geojson').write_text(json.dumps(observations,indent=2)+'\n')
    timeline={'schemaVersion':1,'eventId':event_id,'events':chronology['events'],'sources':chronology['sources']}
    for name,content in [('event',event),('timeline',timeline)]:
        (output/f'{name}.json').write_text(json.dumps(content,indent=2)+'\n')
    print(f'Built event and timeline contracts: {event_id}')
if __name__=='__main__':build()
