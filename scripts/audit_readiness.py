"""Read-only integrity/ownership/availability snapshot; optional one-shot public Census check."""
import argparse, datetime, hashlib, json, subprocess, urllib.request, urllib.error
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
FRONT = ROOT.parent / 'hackathon.frontend'
BASE = 'frontend-handoff-v1'

def git(cwd, *args):
    return subprocess.check_output(['git', '-C', str(cwd), *args], text=True).strip()

def digest(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()

def frontend_path(p):
    return p.startswith('app/') and (not p.startswith('app/api/')) or p in ['src/AtlasMap.tsx', 'src/map-theme.ts', 'playwright.config.ts', 'design.md', 'docs/FRONTEND_PROGRESS.md'] or p.startswith(('src/components/', 'src/hooks/', 'src/styles/', 'src/frontend/', 'public/ui/', 'tests/ui/', '.hallmark/'))

def backend_path(p):
    return p.startswith('tests/') and (not p.startswith('tests/ui/')) or p.startswith(('app/api/', 'data/', 'scripts/', 'src/contracts/')) or p in ['src/data.ts', 'src/spatial.ts', 'src/domain.ts', 'package.json', 'package-lock.json', 'next.config.ts', 'tsconfig.json', 'AGENTS.md', '.gitignore', '.gitattributes']

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--live-geocode', action='store_true')
    parser.add_argument('--output', default='data/audits/readiness-2026-11-07.json')
    args = parser.parse_args()
    result = dict(auditedAt=datetime.datetime.now(datetime.timezone.utc).isoformat(), backendHead=git(ROOT, 'rev-parse', 'HEAD'), frontendHead=git(FRONT, 'rev-parse', 'HEAD'), baseline=git(ROOT, 'rev-parse', BASE), integrity={}, failures=[])

    def check(label, records):
        count = 0
        for target, record in records:
            count += 1
            if not target.exists():
                result['failures'].append(dict(file=str(target.relative_to(ROOT)), kind='missing'))
                continue
            if digest(target) != record['sha256']:
                result['failures'].append(dict(file=str(target.relative_to(ROOT)), kind='sha256-mismatch'))
            if 'bytes' in record and target.stat().st_size != record['bytes']:
                result['failures'].append(dict(file=str(target.relative_to(ROOT)), kind='byte-count-mismatch'))
        if count == 0:
            raise ValueError('Empty audit manifest: ' + label)
        result['integrity'][label] = count
    raw = json.loads((ROOT / 'data/raw/manifest.json').read_text())
    check('rawManifest', [(ROOT / 'data/raw' / k, v) for k, v in raw.items()])
    samples = json.loads((ROOT / 'data/facility-verification/raw-manifest.json').read_text())['responses']
    check('initialFacilitySamples', [(ROOT / 'data/facility-verification' / r['file'], r) for r in samples])
    derived = json.loads((ROOT / 'data/derived-manifest.json').read_text())['files']
    check('derivedManifest', [(ROOT / k, v) for k, v in derived.items()])
    for label, file in [('schools', 'manifest.json'), ('healthcare', 'healthcare-manifest.json')]:
        files = json.loads((ROOT / 'data/facilities' / file).read_text())['files']
        check(label + 'Manifest', [(ROOT / 'data/facilities' / k, v) for k, v in files.items()])
    power = json.loads((ROOT / 'data/contracts/power-readiness.json').read_text())
    check('powerStagedArtifact', [(ROOT / 'data/facility-verification/power-normalized.json', dict(sha256=power['stagedArtifactSha256']))])
    result['knownUnusableRawResponses'] = [k for k, v in raw.items() if str(v.get('validation', '')).startswith('FAILED')]
    source = 'docs/source/california-environmental-atlas-handoff.pdf'
    result['sourcePdfUnchangedFromBaseline'] = git(ROOT, 'hash-object', source) == git(ROOT, 'rev-parse', BASE + ':' + source)
    changed = git(ROOT, 'diff', '--name-only', BASE + '..HEAD').splitlines()
    front_changed = git(FRONT, 'diff', '--name-only', BASE).splitlines()
    untracked = git(FRONT, 'ls-files', '--others', '--exclude-standard').splitlines()
    result['ownership'] = dict(backendTouchedFrontendOwned=[p for p in changed if frontend_path(p)], frontendTouchedBackendOwned=[p for p in front_changed + untracked if backend_path(p)], frontendWorkingStatus=git(FRONT, 'status', '--porcelain=v1').splitlines(), frontendUntracked=untracked, sharedRuntimeConfigDiff=git(ROOT, 'diff', '--name-only', git(FRONT, 'rev-parse', 'HEAD'), '--', 'package.json', 'package-lock.json', 'next.config.ts', 'tsconfig.json', 'src/domain.ts', '.gitignore', '.gitattributes').splitlines())
    inspected = ['src/frontend/provider.ts', 'src/hooks/useFacilities.ts', 'src/components/ComparisonOverview.tsx', 'src/components/ComparisonPanel.tsx', 'src/components/Infrastructure.tsx', 'src/AtlasMap.tsx', 'app/page.tsx', 'docs/FRONTEND_PROGRESS.md']
    result['frontendInspectedFileHashes'] = {p: digest(FRONT / p) for p in inspected if (FRONT / p).exists()}
    result['availability'] = {}
    for port in [3000, 3001]:
        origin = f'http://127.0.0.1:{port}'
        endpoints = {}
        for route in ['/api/health', '/api/indicators', '/api/facilities/catalog', '/api/demographics', '/api/stories']:
            with urllib.request.urlopen(origin + route, timeout=30) as response:
                body = response.read()
                data = json.loads(body)
                endpoints[route] = dict(status=response.status, bytes=len(body), contractVersion=data.get('contractVersion', data.get('apiContract')))
        result['availability'][origin] = endpoints
    if args.live_geocode:
        req = urllib.request.Request('http://127.0.0.1:3000/api/geocode', data=json.dumps(dict(address='125 14th St Oakland CA 94612')).encode(), headers={'Content-Type': 'application/json'})
        stamp = datetime.datetime.now(datetime.timezone.utc).isoformat()
        try:
            with urllib.request.urlopen(req, timeout=30) as response:
                data = json.load(response)
                valid = [c for c in data.get('candidates', []) if 'error' not in c]
                result['publicExampleLiveGeocode'] = dict(checkedAt=stamp, httpStatus=response.status, usableCandidateCount=len(valid), tractIds=[c['tractId'] for c in valid], expectedTractPresent=any((c['tractId'] == '06001403402' for c in valid)), humanConfirmationPerformed=False, rawResponsePersisted=False)
        except (urllib.error.URLError, TimeoutError) as error:
            result['publicExampleLiveGeocode'] = dict(checkedAt=stamp, available=False, errorType=type(error).__name__, retryPerformed=False)
    target = ROOT / args.output
    target.parent.mkdir(exist_ok=True, parents=True)
    target.write_text(json.dumps(result, indent=2))
    print(json.dumps(result, indent=2))
    raise SystemExit(1 if result['failures'] else 0)
if __name__ == '__main__':
    main()
