"""Record reproducible derived artifacts after preparing data and demo fixtures."""
from pathlib import Path
import datetime,hashlib,json
R=Path(__file__).resolve().parents[1]
files=['data/lookup.json','data/display.json','data/observations.json','data/validation.json','data/demo-geocodes.json','data/display-overview.json','data/contracts/map-overview.json']
(R/'data/derived-manifest.json').write_text(json.dumps({'generatedAt':datetime.datetime.now(datetime.timezone.utc).isoformat(),'pipeline':['scripts/prepare_data.py','scripts/cache_demo.py','scripts/prepare_map_overview.py'],'sourceManifest':'data/raw/manifest.json','files':{f:{'sha256':hashlib.sha256((R/f).read_bytes()).hexdigest(),'bytes':(R/f).stat().st_size} for f in files}},indent=2))
