"""Bounded, release-pinned Overture acquisition; successes only, checksummed cache."""
import json, subprocess, sys, os
from datetime import datetime, timezone
from prepare_buildings import ROOT, RELEASE, REGIONS, sha

def main():
    folder = ROOT/'data/raw/buildings'/RELEASE
    folder.mkdir(parents=True,exist_ok=True)
    for name, bbox in REGIONS.items():
        dest = folder/(name+'.geojson'); meta = folder/(name+'.provenance.json')
        if dest.exists() and meta.exists():
            assert sha(dest) == json.loads(meta.read_text())['sha256']
            continue
        # Fail rather than silently scan the global dataset if the spatial catalog fails.
        temp = dest.with_suffix('.partial')
        code = '''import warnings, sys
from overturemaps.core import StacIndexWarning
from overturemaps.cli import cli
warnings.simplefilter('error', StacIndexWarning)
cli()'''
        args = ['download','--bbox='+','.join(map(str,bbox)),'-r',RELEASE,'-t','building','-f','geojson','-o',str(temp)]
        subprocess.run([sys.executable,'-c',code,*args],check=True,timeout=600)
        data = json.loads(temp.read_text()); assert data['type']=='FeatureCollection'
        os.replace(temp,dest)
        meta.write_text(json.dumps({'release': RELEASE,'bbox':bbox,'retrievedAt':datetime.now(timezone.utc).isoformat(),'sha256':sha(dest),'count':len(data['features']),'source':f's3://overturemaps-us-west-2/release/{RELEASE}/theme=buildings/type=building/','client':'overturemaps==2.1.0','license':'ODbL-1.0','schema':'https://docs.overturemaps.org/schema/reference/buildings/building/','licenseUrl':'https://docs.overturemaps.org/attribution/'},indent=2)+'\n')
if __name__=='__main__': main()
