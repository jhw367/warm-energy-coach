import { createServer } from 'node:http';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(fileURLToPath(import.meta.url));
const publicDir = join(root, 'public');
const demo = JSON.parse(readFileSync(join(root, 'data', 'demo.json'), 'utf8'));
const indexHtml = readFileSync(join(publicDir, 'index.html'));
const appCss = readFileSync(join(publicDir, 'app.css'));
const appJs = readFileSync(join(publicDir, 'app.js'));

const port = Number.parseInt(process.env.PORT || '4175', 10);
const host = process.env.HOST || '127.0.0.1';
const pageRoutes = new Set(['/', '/vandaag.html', '/energy.html', '/forward.html', '/whatif.html']);

const securityHeaders = {
  'Content-Security-Policy': "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; connect-src 'self'; font-src 'none'; object-src 'none'; base-uri 'none'; form-action 'self'; frame-ancestors 'none'",
  'Cross-Origin-Opener-Policy': 'same-origin',
  'Referrer-Policy': 'no-referrer',
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY'
};

function send(response, status, body, contentType, extraHeaders = {}) {
  response.writeHead(status, {
    ...securityHeaders,
    'Cache-Control': 'no-store',
    'Content-Type': contentType,
    ...extraHeaders
  });
  response.end(body);
}

function sendJson(response, status, value) {
  send(response, status, JSON.stringify(value), 'application/json; charset=utf-8');
}

function clamp(value, minimum, maximum) {
  return Math.min(maximum, Math.max(minimum, value));
}

function asNumber(value, minimum, maximum, fallback) {
  const number = Number(value);
  return Number.isFinite(number) ? clamp(number, minimum, maximum) : fallback;
}

function calculateScenario(input) {
  const solarPct = asNumber(input.solarPct, 50, 160, 100);
  const flexibleLoadPct = asNumber(input.flexibleLoadPct, 5, 45, 18);
  const storageKwh = asNumber(input.storageKwh, 0, 20, 10);
  const base = demo.scenario.baseline;

  const solarDeltaKwh = demo.energy.solarGenerationKwh * ((solarPct - 100) / 100);
  const captureRatio = clamp(0.45 + flexibleLoadPct / 200 + storageKwh / 100, 0.4, 0.85);
  const capturedSolarDeltaKwh = solarDeltaKwh * captureRatio;
  const flexibleDelta = flexibleLoadPct - base.flexibleLoadPct;
  const storageDelta = storageKwh - base.storageKwh;
  const annualCostEur = clamp(
    base.annualCostEur - capturedSolarDeltaKwh * 0.21 - flexibleDelta * 10 - storageDelta * 18,
    400,
    4000
  );
  const gridImportKwh = clamp(
    base.gridImportKwh - capturedSolarDeltaKwh - flexibleDelta * 12 - storageDelta * 30,
    0,
    10000
  );
  const generationKwh = demo.energy.solarGenerationKwh * (solarPct / 100);
  const directUseKwh = clamp(demo.energy.directSolarUseKwh + capturedSolarDeltaKwh, 0, generationKwh);
  const selfUsePct = generationKwh === 0 ? 0 : (directUseKwh / generationKwh) * 100;

  return {
    inputs: { solarPct, flexibleLoadPct, storageKwh },
    annualCostEur: Math.round(annualCostEur),
    annualSavingEur: Math.round(base.annualCostEur - annualCostEur),
    gridImportKwh: Math.round(gridImportKwh),
    selfUsePct: Number(selfUsePct.toFixed(1)),
    status: 'hypothetical',
    assumptions: [
      'Synthetic annual household profile',
      'Constant €0.21/kWh value for additionally captured generation',
      'No equipment purchase, finance or maintenance costs'
    ]
  };
}

async function readJsonBody(request) {
  let body = '';
  for await (const chunk of request) {
    body += chunk;
    if (body.length > 16_384) throw new Error('Request body is too large');
  }
  return body ? JSON.parse(body) : {};
}

const server = createServer(async (request, response) => {
  const url = new URL(request.url || '/', `http://${host}`);

  if (request.method === 'GET' && url.pathname === '/healthz') {
    sendJson(response, 200, { ok: true, mode: 'synthetic-offline' });
    return;
  }

  if (request.method === 'GET' && url.pathname === '/api/demo') {
    sendJson(response, 200, demo);
    return;
  }

  if (request.method === 'POST' && url.pathname === '/api/whatif') {
    try {
      sendJson(response, 200, calculateScenario(await readJsonBody(request)));
    } catch (error) {
      sendJson(response, 400, { error: error.message });
    }
    return;
  }

  if (!['GET', 'HEAD'].includes(request.method || '')) {
    sendJson(response, 403, { error: 'This judge artifact is read-only and cannot control devices or persist changes.' });
    return;
  }

  if (pageRoutes.has(url.pathname)) {
    send(response, 200, request.method === 'HEAD' ? '' : indexHtml, 'text/html; charset=utf-8');
    return;
  }
  if (url.pathname === '/app.css') {
    send(response, 200, request.method === 'HEAD' ? '' : appCss, 'text/css; charset=utf-8');
    return;
  }
  if (url.pathname === '/app.js') {
    send(response, 200, request.method === 'HEAD' ? '' : appJs, 'text/javascript; charset=utf-8');
    return;
  }
  sendJson(response, 404, { error: 'Not found' });
});

server.listen(port, host, () => {
  const address = server.address();
  const activePort = typeof address === 'object' && address ? address.port : port;
  process.stdout.write(`WARM video demo: http://${host}:${activePort}/vandaag.html\n`);
});

for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => server.close(() => process.exit(0)));
}
