"""Normalize selected, explicitly reviewed facts from preserved official reports."""
from pathlib import Path
import hashlib,json
ROOT=Path(__file__).resolve().parents[1]
def build():
    source=ROOT/'data/raw/chronology-facts.json';data=json.loads(source.read_text())
    for s in data['sources']:
        path=ROOT/s['localPath'];s['sha256']=hashlib.sha256(path.read_bytes()).hexdigest()
    data['inputSha256']=hashlib.sha256(source.read_bytes()).hexdigest()
    (ROOT/'public/data/chronology.json').write_text(json.dumps(data,indent=2)+'\n')
    print(f'{len(data["events"])} milestones and {len(data["airports"])} airport records normalized.')
if __name__=='__main__':build()
