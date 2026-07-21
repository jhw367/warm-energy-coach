# WARM Energy Coach

> Most energy apps tell you what happened. WARM tells you what to do next — and what would change that advice.

WARM is a privacy-safe, interactive jury demo for **OpenAI Build Week 2026** in the **Apps for Your Life** track. It coordinates solar generation, household demand, battery reserve, electricity prices and EV charging into one explainable household plan.

## Demo video

Public YouTube demo: https://youtu.be/EMfEvxNErJw

The video is under three minutes, includes spoken English narration and explains what was built and how Codex with GPT-5.6 was used.

## What the project demonstrates

- A forward-looking recommendation instead of another historical dashboard.
- One coordinated plan across solar, battery, home, grid and electric car.
- Interactive controls for departure time, battery reserve and tomorrow's scenario.
- A fixed seven-step, 90-second jury presentation mode.
- Visible reasoning, rejected alternatives, confidence and modeled impact.
- Synthetic household data only, with no credentials, persistence or device-control path.

The project is intentionally bounded: it advises and explains. It never sends a command to a charger, battery, inverter or other device.

## Run locally

Requirements:

- Node.js 20 or newer
- No package installation, account, API key or external service

```bash
npm start
```

Open:

```text
http://127.0.0.1:4173/
```

Select **Start 90-second story** for the linear jury narrative, or use the interactive controls underneath to change the household constraints and inspect the recalculated recommendation.

## Verify

```bash
npm test
```

The deterministic test starts the local server, loads the main experience and required assets, checks the synthetic/no-control disclosure, rejects mutation requests and scans the public artifact for external network URLs.

## Technical implementation

- Browser-native HTML, CSS and JavaScript
- Small dependency-free Node.js HTTP server
- Deterministic model embedded in the public artifact
- Same-origin-only runtime with restrictive security headers
- No database, cookies, login, third-party SDK, analytics or outbound API calls

The synthetic model combines:

1. forecast solar generation;
2. an electricity-price scenario;
3. EV energy need and departure deadline;
4. a minimum battery reserve for the home; and
5. a transparent comparison of alternative charging choices.

## Codex and GPT-5.6 collaboration

The human retained the consequential product decisions: comfort before savings, advice rather than actuation, visible uncertainty, privacy-safe publication and an explainable recommendation that can be overridden.

Codex with GPT-5.6 accelerated the implementation by:

- translating the connected-home concept into the interactive jury experience;
- implementing the coordinated recommendation and scenario controls;
- challenging double counting and overly precise savings claims;
- separating modeled outcomes from measured facts;
- building the 90-second narrative and interactive proof;
- creating privacy, network and mutation boundaries; and
- preparing reproducible setup and validation evidence.

The result came from repeated questioning, correction and testing rather than accepting a first plausible answer.

## Build Week scope and provenance

WARM began before the event as a private personal energy-learning prototype. During the Build Week submission period, the work was transformed into this separate public competition artifact:

- all private household records and supplier-specific integrations were removed;
- the product journey was reduced to one coordinated, explainable decision;
- a synthetic jury scenario and interactive presentation were created;
- the public artifact was made dependency-free and credential-free; and
- explicit test, safety and documentation boundaries were added.

The commit history in this repository records the public competition work. The Devpost submission also includes the required Codex `/feedback` Session ID from the primary build thread; that identifier is intentionally not stored in the source repository.

## Data and limitations

All visible household values are fictional and deterministic. Monetary figures are illustrative modeled values, not tariffs, quotations or universal savings claims. Real-world recommendations would require household consent, current local data, equipment constraints and a verification loop.

## License

Released under the [MIT License](LICENSE).
