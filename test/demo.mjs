import assert from 'node:assert/strict';
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');
const port = 4174;
const origin = `http://127.0.0.1:${port}`;

async function listFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const target = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await listFiles(target));
    if (entry.isFile()) files.push(target);
  }
  return files;
}

function waitForReady(child) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('Server did not start in time')), 10_000);
    const onData = chunk => {
      if (String(chunk).includes('WARM Energy Coach listening')) {
        clearTimeout(timer);
        child.stdout.off('data', onData);
        resolve();
      }
    };
    child.stdout.on('data', onData);
    child.once('exit', code => {
      clearTimeout(timer);
      reject(new Error(`Server exited before readiness with code ${code}`));
    });
    child.once('error', error => {
      clearTimeout(timer);
      reject(error);
    });
  });
}

const child = spawn(process.execPath, ['server.mjs'], {
  cwd: root,
  env: { ...process.env, HOST: '127.0.0.1', PORT: String(port) },
  stdio: ['ignore', 'pipe', 'pipe']
});

try {
  await waitForReady(child);

  const home = await fetch(`${origin}/`);
  assert.equal(home.status, 200);
  assert.match(home.headers.get('content-security-policy') || '', /default-src 'self'/);
  const html = await home.text();
  assert.match(html, /WARM · Jury Experience/);
  assert.match(html, /jury-v2\.js/);
  assert.match(html, /presentation\.css/);

  const app = await fetch(`${origin}/jury-v2.js`);
  assert.equal(app.status, 200);
  const javascript = await app.text();
  assert.match(javascript, /SYNTHETIC JURY DEMO/);
  assert.match(javascript, /No private data/);
  assert.match(javascript, /no device control/i);
  assert.match(javascript, /Start 90-second story/);
  assert.match(javascript, /Every control immediately recalculates the recommendation/);

  for (const asset of ['/jury.css?v=2', '/presentation.css?v=1']) {
    const response = await fetch(`${origin}${asset}`);
    assert.equal(response.status, 200, `${asset} should load`);
    assert.match(response.headers.get('content-type') || '', /text\/css/);
  }

  const rejectedWrite = await fetch(`${origin}/`, { method: 'POST', body: 'mutate' });
  assert.equal(rejectedWrite.status, 405);
  assert.equal(rejectedWrite.headers.get('allow'), 'GET, HEAD');

  const missing = await fetch(`${origin}/does-not-exist`);
  assert.equal(missing.status, 404);

  const publicFiles = await listFiles(path.join(root, 'public'));
  assert.ok(publicFiles.length >= 4, 'Expected the public jury artifact');
  for (const file of publicFiles) {
    const content = await readFile(file, 'utf8');
    assert.doesNotMatch(content, /https?:\/\//i, `${path.relative(root, file)} must not call external URLs`);
  }

  console.log(`PASS: ${publicFiles.length} public files, local runtime and safety boundary verified`);
} finally {
  child.kill('SIGTERM');
}
