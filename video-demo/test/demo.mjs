import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const port = 4176;
const origin = `http://127.0.0.1:${port}`;
const disclosure = 'Synthetic Build Week demo · offline data · no device control';

const data = JSON.parse(await readFile(join(root, 'data', 'demo.json'), 'utf8'));
const sum = field => data.monthly.reduce((total, month) => total + month[field], 0);
assert.equal(data.meta.datasetKind, 'fully synthetic');
assert.equal(data.meta.days, 365);
assert.equal(data.meta.deviceControl, false);
assert.equal(sum('generation'), data.energy.solarGenerationKwh);
assert.equal(sum('consumption'), data.energy.totalConsumptionKwh);
assert.equal(sum('import'), data.energy.gridImportKwh);
assert.equal(sum('cost'), data.energy.annualCostEur);
assert.equal(data.energy.gridImportKwh + data.energy.directSolarUseKwh, data.energy.totalConsumptionKwh);
assert.equal(data.energy.directSolarUseKwh + data.energy.solarExportKwh, data.energy.solarGenerationKwh);
assert.equal(data.energy.carChargingKwh + data.energy.otherHomeUseKwh, data.energy.totalConsumptionKwh);

const child = spawn(process.execPath, [join(root, 'server.mjs')], {
  cwd: root,
  env: { ...process.env, HOST: '127.0.0.1', PORT: String(port) },
  stdio: ['ignore', 'pipe', 'pipe']
});

async function waitUntilReady() {
  for (let attempt = 0; attempt < 50; attempt += 1) {
    if (child.exitCode !== null) throw new Error(`video demo exited early with ${child.exitCode}`);
    try {
      const response = await fetch(`${origin}/healthz`);
      if (response.ok) return;
    } catch {}
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  throw new Error('video demo did not become ready');
}

try {
  await waitUntilReady();
  for (const route of ['/vandaag.html', '/energy.html', '/forward.html', '/whatif.html']) {
    const response = await fetch(`${origin}${route}`);
    const html = await response.text();
    assert.equal(response.status, 200, `${route} must load`);
    assert.match(html, new RegExp(disclosure.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  }

  const demoResponse = await fetch(`${origin}/api/demo`);
  assert.equal(demoResponse.status, 200);
  const demo = await demoResponse.json();
  assert.equal(demo.meta.datasetId, 'warm-build-week-synthetic-v2');
  assert.equal(demo.decisions.length, 3);

  const scenarioResponse = await fetch(`${origin}/api/whatif`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ solarPct: 130, flexibleLoadPct: 30, storageKwh: 15 })
  });
  const scenario = await scenarioResponse.json();
  assert.equal(scenario.status, 'hypothetical');
  assert.ok(scenario.annualSavingEur > 0);
  assert.ok(scenario.gridImportKwh < demo.scenario.baseline.gridImportKwh);

  const blocked = await fetch(`${origin}/api/demo`, { method: 'POST' });
  assert.equal(blocked.status, 403);
  assert.match((await blocked.json()).error, /read-only/);

  console.log('PASS: four-view video demo, synthetic balance and write boundary verified');
} finally {
  child.kill('SIGTERM');
  await new Promise(resolve => {
    if (child.exitCode !== null) resolve();
    else child.once('exit', resolve);
  });
}
