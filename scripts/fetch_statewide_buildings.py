"""Acquire a complete California-envelope Overture PMTiles extract, atomically.
No account/billing required. Requires ~1.6 GB free plus working space. The local
CLI installation is pinned and checksum-verified, never installed globally.
"""
import argparse, hashlib, json, os, platform, shutil, subprocess, zipfile
from pathlib import Path
from datetime import datetime, timezone
import requests
ROOT=Path(__file__).resolve().parents[1]
VERSION='2026-10-21.0'
SOURCE=f'https://overturemaps-extras-us-west-2.s3.us-west-2.amazonaws.com/tiles/{VERSION}/buildings.pmtiles'
ETAG='"21c7d93cafdd2160035ba2b268e25452-674"'
BBOX='-124.49,32.53,-114.13,42.01'
CLI_VERSION='1.31.2'
CLI_ZIP_SHA='40528f7f616fcbf91207cd48c8fc023d213f6d86c0cbf1f748732803d1880f3d'

def sha(file):
    h=hashlib.sha256()
    with open(file,'rb') as f:
        for b in iter(lambda:f.read(1024*1024),b''): h.update(b)
    return h.hexdigest()

def cli():
    if (platform.system(),platform.machine()) != ('Darwin','arm64'):
        raise RuntimeError('Automatic CLI acquisition is pinned for Darwin arm64; add a checksum-verified platform asset before acquisition on another platform.')
    folder=ROOT/'.tools'/f'pmtiles-{CLI_VERSION}';folder.mkdir(parents=True,exist_ok=True)
    archive=folder/'download.zip'
    if not archive.exists():
        r=requests.get(f'https://github.com/protomaps/go-pmtiles/releases/download/v{CLI_VERSION}/go-pmtiles-{CLI_VERSION}_Darwin_arm64.zip',timeout=120);r.raise_for_status();archive.write_bytes(r.content)
    assert sha(archive)==CLI_ZIP_SHA,'CLI distribution checksum mismatch'
    # Reextract the verified executable so a preexisting unverified binary isn't trusted.
    with zipfile.ZipFile(archive) as z: (folder/'pmtiles').write_bytes(z.read('pmtiles'))
    (folder/'pmtiles').chmod(0o755)
    return str(folder/'pmtiles')

def main():
    parser=argparse.ArgumentParser();parser.add_argument('--finalize',type=Path);args=parser.parse_args()
    folder=ROOT/'data/buildings'/VERSION;folder.mkdir(parents=True,exist_ok=True)
    dest=folder/'california.pmtiles';proof=ROOT/'data/contracts/buildings-statewide.json'
    if dest.exists() and proof.exists() and not args.finalize:
        assert sha(dest)==json.loads(proof.read_text())['sha256'];print('Verified cached statewide archive');return
    binary=cli()
    upstream=requests.get(SOURCE,headers={'Range':'bytes=0-126'},timeout=30)
    assert upstream.status_code==206 and upstream.headers['ETag']==ETAG,'Upstream identity/range mismatch'
    temp=args.finalize or folder/'california.fetching.pmtiles'
    if not args.finalize:
        assert shutil.disk_usage(folder).free>1_800_000_000,'Insufficient space for statewide extract'
        subprocess.run([binary,'extract',SOURCE,str(temp),'--bbox='+BBOX,'--download-threads=16','--quiet'],check=True,timeout=1800)
    subprocess.run([binary,'verify',str(temp)],check=True,timeout=120)
    metadata=json.loads(subprocess.check_output([binary,'show',str(temp),'--metadata']))
    header=json.loads(subprocess.check_output([binary,'show',str(temp),'--header-json']))
    checksum=sha(temp)
    record={'datasetVersion':VERSION,'sourceUrl':SOURCE,'sourceEtag':ETAG,'retrievedAt':datetime.now(timezone.utc).isoformat(),'extractionBounds':list(map(float,BBOX.split(','))),'scope':'statewide-california-envelope','sha256':checksum,'bytes':temp.stat().st_size,'cliVersion':CLI_VERSION,'cliDistributionSha256':CLI_ZIP_SHA,'license':'ODbL-1.0','licenseUrl':'https://opendatacommons.org/licenses/odbl/1-0/','attributionUrl':'https://docs.overturemaps.org/attribution/','header':header,'sourceTileMetadata':metadata,'command':['extract',SOURCE,'california.pmtiles','--bbox='+BBOX,'--download-threads=16','--quiet']}
    os.replace(temp,dest)
    proof.write_text(json.dumps(record,indent=2)+'\n')
    print(json.dumps({k:record[k] for k in ('sha256','bytes','scope')},indent=2))
if __name__=='__main__': main()
