import {test} from 'node:test';
import assert from 'node:assert/strict';
import {existsSync, readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';

test('every archived Ash RGB input is present and matches its recorded checksum', () => {
  const archive = JSON.parse(readFileSync('public/data/ash-rgb.json', 'utf8'));
  for (const frame of archive.frames) {
    for (const input of frame.inputs) {
      assert.ok(existsSync(input.path), `Missing ${input.path}. See docs/ash-rgb-pipeline.md#restore-raw-inputs-for-integrity-tests`);
      const bytes = readFileSync(input.path);
      assert.equal(bytes.length, input.bytes, input.path);
      assert.equal(createHash('sha256').update(bytes).digest('hex'), input.sha256, input.path);
    }
  }
});
