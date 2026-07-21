const app = document.querySelector('#app');
const routes = {
  '/': 'today',
  '/vandaag.html': 'today',
  '/energy.html': 'insight',
  '/forward.html': 'decide',
  '/whatif.html': 'explore'
};
const activeView = routes[window.location.pathname] || 'today';
const eur = new Intl.NumberFormat('en-IE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 });
const eurPrecise = new Intl.NumberFormat('en-IE', { style: 'currency', currency: 'EUR', minimumFractionDigits: 2, maximumFractionDigits: 2 });
const number = new Intl.NumberFormat('en-IE', { maximumFractionDigits: 0 });

function heightClass(value, maximum) {
  const step = Math.max(0, Math.min(20, Math.round((value / maximum) * 20)));
  return `h-${step}`;
}

for (const link of document.querySelectorAll('[data-route]')) {
  if (link.dataset.route === activeView) link.setAttribute('aria-current', 'page');
}

function pageHead(eyebrow, title, lede, side = '') {
  return `
    <header class="page-head">
      <div>
        <p class="eyebrow">${eyebrow}</p>
        <h1>${title}</h1>
        <p class="lede">${lede}</p>
      </div>
      ${side}
    </header>`;
}

function todayView(data) {
  const slots = data.today.slots.map((slot) => `
    <div class="slot">
      <div class="slot-bars" title="${slot.hour}:00 · ${slot.solarKw} kW solar · €${slot.priceEurKwh.toFixed(2)}/kWh">
        <span class="bar solar ${heightClass(slot.solarKw, 5.4)}"></span>
        <span class="bar price ${heightClass(slot.priceEurKwh, 0.38)}"></span>
      </div>
      <div><strong>${slot.hour}:00</strong><small>€${slot.priceEurKwh.toFixed(2)}</small></div>
    </div>`).join('');

  const actions = data.today.actions.map((action) => `
    <div class="action-row">
      <div class="action-time">${action.time}</div>
      <div><h3>${action.title}</h3><p>${action.detail}</p></div>
      <span class="evidence">${action.evidence}</span>
    </div>`).join('');

  const trace = data.today.decisionTrace.map((step, index) => `
    <div class="trace-step">
      <span class="trace-number">${index + 1}</span>
      <div><strong>${step.label}</strong><p>${step.detail}</p></div>
    </div>`).join('');

  const valueBasis = data.today.valueBasis.map((item) => `
    <span><strong>${item.label}</strong>${item.calculation}</span>`).join('');

  app.innerHTML = `
    ${pageHead(
      data.today.dateLabel,
      data.today.headline,
      data.today.reason,
      `<div class="value-block"><strong>${eurPrecise.format(data.today.estimatedValueEur)}</strong><span>modeled value · synthetic day</span></div>`
    )}
    <section class="grid two" aria-label="Today's energy plan">
      <article class="card highlight">
        <span class="pill">Two practical moves</span>
        <div class="action-list">${actions}</div>
      </article>
      <article class="card">
        <h2>Why these hours?</h2>
        <p class="lede">WARM combines the synthetic solar shape, household load and price signal—then explains the trade-off.</p>
        <div class="timeline">${slots}</div>
        <div class="legend"><span class="solar">Synthetic solar</span><span class="price">Synthetic price</span></div>
      </article>
    </section>
    <section class="card trace-card spaced-card">
      <div class="card-heading">
        <div><p class="eyebrow">Decision trace</p><h2>Signal → rule → reversible recommendation</h2></div>
        <span class="pill">No black box</span>
      </div>
      <div class="trace">${trace}</div>
      <div class="trace-footer">
        <div class="value-basis">${valueBasis}</div>
        <p><strong>What would change it?</strong> ${data.today.wouldChange}</p>
      </div>
    </section>`;
}

function insightView(data) {
  const energy = data.energy;
  const metrics = [
    ['Generation', energy.solarGenerationKwh, 'kWh', 'Direct · synthetic'],
    ['Home use', energy.totalConsumptionKwh, 'kWh', 'Inferred · balanced'],
    ['Grid import', energy.gridImportKwh, 'kWh', 'Direct · synthetic'],
    ['Annual cost', energy.annualCostEur, '€', 'Assumed tariff model']
  ].map(([label, value, unit, source]) => `
    <article class="card soft metric">
      <span class="eyebrow">${label}</span>
      <div class="number">${unit === '€' ? eur.format(value) : number.format(value)}</div>
      <div class="caption">${unit === '€' ? 'per year' : `${unit} · 365 days`}</div>
      <div class="source">${source}</div>
    </article>`).join('');

  const months = data.monthly.map((month) => `
    <div class="month">
      <div class="month-bars" title="${month.month}: ${month.generation} kWh generated, ${month.consumption} kWh used">
        <span class="bar solar ${heightClass(month.generation, 1080)}"></span>
        <span class="bar use ${heightClass(month.consumption, 1080)}"></span>
      </div>
      <small>${month.month}</small>
    </div>`).join('');

  app.innerHTML = `
    ${pageHead('Insight · 365 synthetic days', 'One household, one explainable energy balance.', 'Every number is labelled by evidence type. Storage movement stays separate so it cannot be double-counted.')}
    <section class="grid two">${metrics}</section>
    <section class="card spaced-card">
      <h2>Electricity balance</h2>
      <div class="equation" aria-label="Grid import plus direct solar use equals total consumption">
        <span><strong>${number.format(energy.gridImportKwh)}</strong><br>grid import</span>
        <span class="operator">+</span>
        <span><strong>${number.format(energy.directSolarUseKwh)}</strong><br>direct solar</span>
        <span class="operator">=</span>
        <span><strong>${number.format(energy.totalConsumptionKwh)}</strong><br>home use</span>
      </div>
    </section>
    <section class="card spaced-card">
      <h2>Seasonal shape</h2>
      <p class="lede">Monthly bins preserve the annual totals while making the fictional scenario easy to inspect.</p>
      <div class="monthly-chart">${months}</div>
      <div class="legend"><span class="solar">Generation</span><span class="use">Consumption</span></div>
    </section>`;
}

function decideView(data) {
  const decisions = data.decisions.map((decision) => `
    <article class="card decision">
      <span class="rank">${decision.rank}</span>
      <h2>${decision.title}</h2>
      <div class="saving">${eur.format(decision.savingEurYear)}<small> modeled opportunity / year</small></div>
      <p>${decision.why}</p>
      <div class="first-step"><strong>First safe step:</strong> ${decision.firstStep}</div>
      <div class="would-change"><strong>Would change if:</strong> ${decision.wouldChange}</div>
      <div class="tags"><span class="confidence">${decision.confidence} confidence</span><span class="effort">${decision.effort} effort</span></div>
    </article>`).join('');

  app.innerHTML = `
    ${pageHead(
      'Decide · ranked actions',
      'From a dashboard to a decision.',
      'WARM ranks understandable next steps by estimated value, confidence and effort. It advises; it never operates equipment.',
      '<div class="scope-note"><strong>Alternative estimates</strong><span>Evaluate separately · do not add</span></div>'
    )}
    <section class="grid three">${decisions}</section>
    <section class="card soft spaced-card">
      <h2>Transparent ranking, not a black box</h2>
      <div class="method">
        <div><strong>1 · Detect</strong><span>Find repeatable energy patterns.</span></div>
        <div><strong>2 · Estimate</strong><span>Calculate a bounded annual value.</span></div>
        <div><strong>3 · Qualify</strong><span>Show confidence and assumptions.</span></div>
        <div><strong>4 · Rank</strong><span>Balance value with household effort.</span></div>
      </div>
    </section>`;
}

function exploreView(data) {
  const baseline = data.scenario.baseline;
  app.innerHTML = `
    ${pageHead('Explore · explicit assumptions', 'Change the scenario, not the house.', 'This calculator is deliberately hypothetical. It recomputes locally and cannot save settings or send commands.')}
    <section class="explorer">
      <form class="card" id="scenario-form">
        <h2>Household assumptions</h2>
        <div class="control">
          <div class="control-head"><label for="solar">Generation capacity</label><output id="solar-output">${baseline.solarPct}%</output></div>
          <input id="solar" name="solarPct" type="range" min="50" max="160" step="5" value="${baseline.solarPct}">
          <div class="range-labels"><span>50%</span><span>160%</span></div>
        </div>
        <div class="control">
          <div class="control-head"><label for="flex">Flexible household load</label><output id="flex-output">${baseline.flexibleLoadPct}%</output></div>
          <input id="flex" name="flexibleLoadPct" type="range" min="5" max="45" step="1" value="${baseline.flexibleLoadPct}">
          <div class="range-labels"><span>5%</span><span>45%</span></div>
        </div>
        <div class="control">
          <div class="control-head"><label for="storage">Storage assumption</label><output id="storage-output">${baseline.storageKwh} kWh</output></div>
          <input id="storage" name="storageKwh" type="range" min="0" max="20" step="1" value="${baseline.storageKwh}">
          <div class="range-labels"><span>0 kWh</span><span>20 kWh</span></div>
        </div>
        <p class="lede control-note">Move any slider. The result is a bounded comparison with the same synthetic baseline—not a quote or control instruction.</p>
      </form>
      <article class="card dark" aria-live="polite">
        <span class="hypothetical">Hypothetical result</span>
        <div class="scenario-results" id="scenario-results"></div>
        <h3>Assumptions included in every result</h3>
        <ul class="assumptions" id="assumptions"></ul>
      </article>
    </section>`;

  const form = document.querySelector('#scenario-form');
  const inputs = [...form.querySelectorAll('input')];
  let requestId = 0;

  async function update() {
    document.querySelector('#solar-output').textContent = `${form.solarPct.value}%`;
    document.querySelector('#flex-output').textContent = `${form.flexibleLoadPct.value}%`;
    document.querySelector('#storage-output').textContent = `${form.storageKwh.value} kWh`;
    const currentRequest = ++requestId;
    const response = await fetch('/api/whatif', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(Object.fromEntries(new FormData(form)))
    });
    if (!response.ok) throw new Error('Scenario calculation failed');
    const result = await response.json();
    if (currentRequest !== requestId) return;
    const deltaClass = result.annualSavingEur >= 0 ? 'positive' : 'negative';
    document.querySelector('#scenario-results').innerHTML = `
      <div class="result"><span>Annual energy cost</span><strong>${eur.format(result.annualCostEur)}</strong></div>
      <div class="result"><span>Versus baseline</span><strong class="delta ${deltaClass}">${result.annualSavingEur >= 0 ? '+' : '−'}${eur.format(Math.abs(result.annualSavingEur))}</strong></div>
      <div class="result"><span>Grid import</span><strong>${number.format(result.gridImportKwh)} kWh</strong></div>
      <div class="result"><span>Self-use</span><strong>${result.selfUsePct}%</strong></div>`;
    document.querySelector('#assumptions').innerHTML = result.assumptions.map((item) => `<li>${item}</li>`).join('');
  }

  for (const input of inputs) input.addEventListener('input', () => update().catch(showError));
  update().catch(showError);
}

function showError(error) {
  app.innerHTML = `<section class="error"><strong>Demo unavailable.</strong> ${error.message}</section>`;
}

fetch('/api/demo', { headers: { Accept: 'application/json' } })
  .then((response) => {
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return response.json();
  })
  .then((data) => {
    const render = { today: todayView, insight: insightView, decide: decideView, explore: exploreView }[activeView];
    render(data);
  })
  .catch(showError);
