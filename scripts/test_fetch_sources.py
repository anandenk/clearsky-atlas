"""Source-cache regressions; synthetic HTTP bodies only, no network requests."""
import hashlib
import json
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch
import fetch_sources as source


class Response:
    status = 200
    def __init__(self, body): self.body = body
    def __enter__(self): return self
    def __exit__(self, *_): pass
    def read(self): return self.body


class SourceCacheTests(unittest.TestCase):
    def test_http_200_html_is_recorded_as_failure_not_cached_pdf(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory); raw = root / 'raw'; raw.mkdir()
            with patch.object(source, 'ROOT', root), patch.object(source, 'RAW', raw), patch.object(source.urllib.request, 'urlopen', return_value=Response(b'<html>blocked</html>')):
                with self.assertRaisesRegex(ValueError, 'Expected PDF'):
                    source.fetch('report.pdf', 'https://example.invalid/report')
            self.assertFalse((raw / 'report.pdf').exists())
            self.assertFalse((raw / 'manifest.json').exists())
            records = json.loads((root / 'data/failures/manifest.json').read_text())
            self.assertEqual(records[0]['httpStatus'], 200)
            self.assertEqual(records[0]['bytes'], 20)

    def test_valid_json_caches_exact_bytes_and_reuses_without_network(self):
        with tempfile.TemporaryDirectory() as directory:
            raw = Path(directory); body = b'{ "features": [] }\r\n'
            with patch.object(source, 'RAW', raw), patch.object(source.urllib.request, 'urlopen', return_value=Response(body)) as network:
                p = source.fetch('sample.json', 'https://example.invalid/source')
                self.assertEqual(p.read_bytes(), body)
                source.fetch('sample.json', 'https://example.invalid/source')
                self.assertEqual(network.call_count, 1)
                with self.assertRaisesRegex(ValueError, 'different source URL'):
                    source.fetch('sample.json', 'https://example.invalid/other')
                p.write_bytes(b'changed')
                with self.assertRaisesRegex(ValueError, 'checksum mismatch'):
                    source.fetch('sample.json', 'https://example.invalid/source')

    def test_old_failed_pdf_is_not_reused_despite_matching_checksum(self):
        with tempfile.TemporaryDirectory() as directory:
            raw = Path(directory); body = b'<html>not a PDF</html>'
            (raw / 'bad.pdf').write_bytes(body)
            (raw / 'manifest.json').write_text(json.dumps({'bad.pdf': {'url': 'u', 'sha256': hashlib.sha256(body).hexdigest()}}))
            with patch.object(source, 'RAW', raw), patch.object(source.urllib.request, 'urlopen') as network:
                with self.assertRaisesRegex(ValueError, 'Expected PDF'): source.fetch('bad.pdf', 'u')
                network.assert_not_called()

    def test_error_envelopes_and_wrong_csv_zip_schemas_are_rejected(self):
        for name, body in [('a.json', b'{"error":{"code":400}}'), ('b.json', b'{"success":false}'), ('c.csv', b'wrong,header\n1,2'), ('d.zip', b'not a zip')]:
            with self.subTest(name=name), self.assertRaises(ValueError): source.validate_payload(name, body)
        self.assertEqual(source.validate_payload('a.pdf', b'%PDF-1.7\n'), 'passed-pdf-header')
        self.assertEqual(source.validate_payload('a.csv', b'tract,pm,pmP\n'), 'passed-ces-csv-header')


if __name__ == '__main__': unittest.main()
