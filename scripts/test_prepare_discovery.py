"""Independent miniature spatial fixture for ambiguous/unmatched joins and status retention."""
import contextlib
import io
import json
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch
import prepare_discovery

class DiscoveryPreparationTest(unittest.TestCase):
    def test_boundaries_unmatched_and_source_statuses(self):
        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary)
            def write(name, value):
                p = root / name
                p.parent.mkdir(parents=True, exist_ok=True)
                p.write_text(json.dumps(value))
            def tract(tid, west, east):
                return {"type": "Feature", "properties": {"id": tid}, "geometry": {"type": "Polygon", "coordinates": [[[west, 0], [east, 0], [east, 1], [west, 1], [west, 0]]]}}
            left, right = "06001000000", "06001000001"
            write("data/lookup.json", {"type": "FeatureCollection", "features": [tract(left, 0, 1), tract(right, 1, 2)]})
            write("data/observations.json", {tid: {"county": "Fixture", "approx_loc": "Fixture"} for tid in [left, right]})
            records = []
            for sid, coordinate, status in [("active", [0.5, 0.5], "Active"), ("closed", [1.5, 0.5], "Closed"), ("unknown", [1.6, 0.6], None), ("boundary", [1, 0.5], "Active"), ("outside", [4, 4], "Active"), ("missing", None, "Active")]:
                records.append({"id": sid, "coordinate": coordinate, "status": status, "name": sid, "sourcePeriod": "fixture", "subtype": None, "sourceAttributes": {"Status": status}})
            write("data/facilities/schools.json", {"datasetVersion": "fixture", "sourceUrl": "https://example.com", "facilities": records})
            write("data/facilities/healthcare.json", {"datasetVersion":"fixture-health", "sourceUrl":"https://example.com/health", "facilities":[{"id":"h", "name":"Hospital", "coordinate":[0.5,0.5],"status":"OPEN","sourcePeriod":"fixture","subtype":"GACH"},{"id":"agency","name":"Home health","coordinate":[1.5,0.5],"status":"OPEN","sourcePeriod":"fixture","subtype":"HHA"},{"id":"closed","name":"Closed hospital","coordinate":[1.5,0.5],"status":"CLOSED","sourcePeriod":"fixture","subtype":"GACH"}]})
            write("data/raw/schools-full-metadata.json", {"fields": [{"name": "Status", "description": json.dumps({"value": "Active, closed or pending"})}]})
            with patch.object(prepare_discovery, "ROOT", root), contextlib.redirect_stdout(io.StringIO()):
                prepare_discovery.build()
                first = (root / "data/discovery/index.json").read_bytes()
                prepare_discovery.build()
                self.assertEqual(first, (root / "data/discovery/index.json").read_bytes())
            index = json.loads(first)
            manifest = json.loads((root / "data/discovery/manifest.json").read_text())
            self.assertEqual(index["rows"][0]["healthcare"]["hospital"]["distanceKm"], 0)
            self.assertEqual(index["rows"][1]["healthcare"]["hospital"]["facilityId"], "h")
            self.assertIsNone(index["rows"][1]["healthcare"]["clinic"])
            self.assertEqual(index["rows"][0]["representativePoint"], [0.5,0.5])
            self.assertEqual(set(index["healthcareFacilities"]), {"h"})
            self.assertEqual(index["rows"][0]["schoolIds"], ["active"])
            self.assertEqual(index["rows"][1]["schoolIds"], ["closed", "unknown"])
            self.assertIsNone(index["schools"]["unknown"]["status"])
            self.assertEqual(manifest["audit"]["ambiguous"], [{"id": "boundary", "tractIds": [left, right]}])
            self.assertEqual(len(manifest["audit"]["unmatched"]), 2)

if __name__ == "__main__":
    unittest.main()
