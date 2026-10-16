import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

test('local launcher rejects invalid LAB_TOKEN overrides before opening either listener', () => {
  const launcher = fileURLToPath(new URL('../scripts/dev.mjs', import.meta.url));
  for (const token of ['a', '', '                ']) {
    const run = spawnSync(process.execPath, [launcher], {
      env: { ...process.env, LAB_TOKEN: token },
      encoding: 'utf8',
      timeout: 5000,
      windowsHide: true,
    });
    assert.equal(run.error, undefined, 'invalid configuration must exit without waiting for server shutdown');
    assert.equal(run.status, 1);
    assert.match(run.stderr, /^LAB_TOKEN must contain at least 16 characters\./);
    assert.equal(run.stdout, '', 'no service URL or control key should be announced');
  }
});
