"""Cache validated official source bytes with provenance; never trust HTTP 200 alone."""
import csv
import datetime
import hashlib
import io
import json
import urllib.request
import zipfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
RAW = ROOT / 'data/raw'
RAW.mkdir(parents=True, exist_ok=True)


def validate_payload(name, body):
    """Return validation label or raise before success-cache mutation."""
    lower = body[:2048].lower()
    if b'incapsula' in lower or (len(body) < 2000 and b'robots' in lower and b'noindex' in lower):
        raise ValueError('Origin returned security HTML, not usable source content')
    if name.endswith('.pdf'):
        if not body.startswith(b'%PDF-'):
            raise ValueError('Expected PDF magic header')
        return 'passed-pdf-header'
    if name.endswith('.json'):
        payload = json.loads(body)
        if isinstance(payload, dict) and ('error' in payload or payload.get('success') is False):
            raise ValueError('Source returned JSON error envelope')
        return 'passed-json-envelope'
    if name.endswith('.zip'):
        if not zipfile.is_zipfile(io.BytesIO(body)):
            raise ValueError('Expected valid ZIP container')
        with zipfile.ZipFile(io.BytesIO(body)) as z:
            if not any(n.endswith('.shp') for n in z.namelist()):
                raise ValueError('Expected shapefile in source ZIP')
        return 'passed-shapefile-zip-container'
    if name.endswith('.csv'):
        header = next(csv.reader(io.StringIO(body.decode('utf-8-sig'))), [])
        if 'tract' not in header or 'pm' not in header or 'pmP' not in header:
            raise ValueError('CES CSV missing required tract/PM field headers')
        return 'passed-ces-csv-header'
    return 'passed-security-page-screen-only'


def fetch(name, url):
    if Path(name).name != name:
        raise ValueError('Cache name must be a basename')
    manifest_path = RAW / 'manifest.json'
    manifest = json.loads(manifest_path.read_text()) if manifest_path.exists() else {}
    target = RAW / name
    if target.exists() and name in manifest:
        body = target.read_bytes()
        record = manifest[name]
        if record['url'] != url:
            raise ValueError('Cache name is already associated with a different source URL')
        if hashlib.sha256(body).hexdigest() != record['sha256']:
            raise ValueError('Cached source checksum mismatch')
        validate_payload(name, body)  # old FAILED HTTP-200 responses are never reused as successes
        return target
    with urllib.request.urlopen(url, timeout=120) as response:
        body = response.read()
        status = response.status
    stamp = datetime.datetime.now(datetime.timezone.utc).isoformat()
    digest = hashlib.sha256(body).hexdigest()
    try:
        validation = validate_payload(name, body)
    except (ValueError, UnicodeError, zipfile.BadZipFile) as error:
        failures = ROOT / 'data/failures'
        failures.mkdir(parents=True, exist_ok=True)
        audit = failures / 'manifest.json'
        records = json.loads(audit.read_text()) if audit.exists() else []
        failure_name = name + '.' + digest[:12] + '.response'
        (failures / failure_name).write_bytes(body)
        records.append(dict(url=url, retrievedAt=stamp, httpStatus=status, sha256=digest,
                            bytes=len(body), responseFile=failure_name, error=str(error)))
        audit.write_text(json.dumps(records, indent=2))
        raise ValueError(f'{name}: {error}; response recorded under data/failures') from error
    temporary = target.with_name(target.name + '.partial')
    temporary.write_bytes(body)
    temporary.replace(target)
    manifest[name] = dict(url=url, retrievedAt=stamp, sha256=digest, bytes=len(body),
                          httpStatus=status, validation=validation)
    temporary_manifest = manifest_path.with_suffix('.partial')
    temporary_manifest.write_text(json.dumps(manifest, indent=2))
    temporary_manifest.replace(manifest_path)
    return target


if __name__ == '__main__':
    package = fetch('ces-catalog.json', 'https://publish.data.ca.gov/api/3/action/package_show?id=calenviroscreen-5-0')
    for resource in json.loads(package.read_text())['result']['resources']:
        fmt = resource['format'].lower()
        if fmt in ['csv', 'pdf', 'shp']:
            print(fetch('ces.' + {'csv': 'csv', 'pdf': 'pdf', 'shp': 'shp.zip'}[fmt], resource['url']))
    fetch('ces-layer.json', 'https://services1.arcgis.com/PCHfdHz4GlDNAhBb/arcgis/rest/services/calenviroscreen50results_F_070126_gdb/FeatureServer/2?f=pjson')
