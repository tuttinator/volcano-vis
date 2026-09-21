"""Exercise the export CLI against the committed scientific snapshot."""
import json
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest

ROOT = Path(__file__).resolve().parents[2]


def load(path):
    return json.loads(path.read_text())


class ExportTests(unittest.TestCase):
    def run_export(self, *args):
        return subprocess.run(
            [sys.executable, str(ROOT / 'pipelines/export_site.py'), *map(str, args)],
            cwd=ROOT, capture_output=True, text=True,
        )

    def test_standalone_metadata_preserves_article_evidence(self):
        with tempfile.TemporaryDirectory() as temporary:
            out = Path(temporary) / 'bundle'
            result = self.run_export('--output', out, '--skip-images')
            self.assertEqual(result.returncode, 0, result.stderr)
            self.assertIn('Metadata-only', result.stdout)
            replay = load(out / 'replay.json')
            catalog = load(ROOT / 'public/data/catalog.json')
            products = [p for p in catalog['products'] if p['volcanoId'] == replay['volcanoId']]
            self.assertEqual([p['id'] for p in replay['advisories']], [p['id'] for p in products])
            for original, exported in zip(products, replay['advisories']):
                for key in ('issuedAt', 'observedAt', 'supersededBy', 'leadStates', 'sourceUrl'):
                    self.assertEqual(original[key], exported[key])
                self.assertEqual(len(original['components']), len(exported['components']))
            for kind, filename in [('ir', 'himawari.json'), ('ash', 'ash-rgb.json')]:
                archive = load(ROOT / 'public/data' / filename)
                self.assertEqual(replay['imagery'][kind]['frames'], [Path(f['url']).stem for f in archive['frames']])
            self.assertEqual(replay['gaps'], load(ROOT / 'public/data/himawari.json')['unavailableTimes'])
            timeline = load(ROOT / 'public/data/events/anak-krakatau-2026-09/timeline.json')
            self.assertEqual(replay['events'], timeline['events'])
            airports = {a['id']: a for a in load(ROOT / 'public/data/airports.json')['airports']}
            for airport in replay['airports']:
                self.assertEqual(airport['coordinates'], airports[airport['id']]['coordinates'])
                self.assertEqual(airport['locationSourceUrl'], airports[airport['id']]['sourceUrl'])
            atung = next(a for a in replay['airports'] if a['id'] == 'atungbusu')
            self.assertEqual(atung['name'], 'Atung Bungsu')
            self.assertIsNone(atung['reopenedAt'])
            comparison = load(out / 'comparison.json')
            self.assertEqual(len(comparison['volcanoes']), 6)
            for card in comparison['volcanoes']:
                latest = max((p for p in catalog['products'] if p['volcanoId'] == card['id'] and not p['supersededBy']), key=lambda p: p['issuedAt'])
                self.assertEqual(card['latest']['id'], latest['id'])
            self.assertEqual(len(load(out / 'directory.json')['volcanoes']), 127)
            self.assertEqual((out / 'land.geojson').read_bytes(), (ROOT / 'public/data/land.geojson').read_bytes())
            self.assertFalse(list(out.rglob('*.webp')))

    def test_site_destination_must_be_explicit_and_valid(self):
        with tempfile.TemporaryDirectory() as temporary:
            site = Path(temporary)
            result = self.run_export('--site', site, '--skip-images')
            self.assertNotEqual(result.returncode, 0)
            self.assertFalse((site / 'static').exists())
            (site / 'svelte.config.js').touch()
            result = self.run_export('--site', site, '--skip-images')
            self.assertEqual(result.returncode, 0, result.stderr)
            self.assertTrue((site / 'static/data/volcanic-ash/replay.json').exists())

    def test_destinations_are_mutually_exclusive(self):
        result = self.run_export('--site', '.', '--output', '.', '--skip-images')
        self.assertNotEqual(result.returncode, 0)
        self.assertIn('not allowed with argument', result.stderr)
