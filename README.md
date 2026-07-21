# WARM Energy Coach

> Most energy apps tell you what happened. WARM tells you what to do next — and what would change that advice.

WARM is a privacy-safe public jury project for **OpenAI Build Week 2026** in the **Apps for Your Life** track. It treats solar generation, household demand, battery reserve, electricity prices and EV charging as one connected system and turns them into explainable next decisions.

## Demo video

Public YouTube demo: https://youtu.be/EMfEvxNErJw

The video is under three minutes, includes spoken English narration and explains what was built and how Codex with GPT-5.6 was used.

## Judge routes

The repository contains two complementary, fully synthetic experiences.

### 1. Video-aligned four-view product

This is the exact product journey demonstrated in the public video: **Today → Insight → Decide → Explore**.

```bash
npm run start:video
```

Open:

```text
http://127.0.0.1:4175/vandaag.html
```

- **Today** gives two timed actions and exposes signal → rule → recommendation.
- **Insight** reconciles the fictional 365-day energy balance.
- **Decide** ranks alternatives by modeled opportunity, confidence and effort without adding overlapping estimates.
- **Explore** recalculates a bounded hypothetical scenario from explicit assumptions.

### 2. Interactive 90-second jury experience

This later presentation layer reduces the same thesis to one coordinated household decision and lets a judge change departure time, battery reserve and tomorrow's scenario.

```bash
npm start
```

Open:

```text
http://127.0.0.1:4173/
```

Select **Start 90-second story** for the fixed narrative, or use the interactive controls underneath.

## What the project demonstrates

- A forward-looking recommendation instead of another historical dashboard.
- One coordinated view across solar, battery, home, grid and electric car.
- Visible reasoning, rejected alternatives, confidence and reversal conditions.
- Separation between measured-like synthetic values, calculations, assumptions and forecasts.
- Synthetic household data only, with no credentials, persistence or device-control path.

The project is intentionally bounded: it advises and explains. It never sends a command to a charger, battery, inverter or other device.

## Requirements

- Node.js 20 or newer
- No package installation, account, API key or external service

## Verify

```bash
npm test
```

The deterministic tests run both experiences. They load the required routes and assets, reconcile the fictional energy identities, exercise the scenario calculations, check the synthetic/no-control disclosures and reject unauthorized mutation requests.

## Technical implementation

- Browser-native HTML, CSS and JavaScript
- Two small dependency-free Node.js HTTP servers
- Deterministic synthetic models bundled in the repository
- Same-origin-only runtimes with restrictive security headers
- No database, cookies, login, third-party SDK, analytics or outbound API calls

The models combine:

1. forecast solar generation;
2. an electricity-price scenario;
3. EV energy need and departure deadline;
4. a minimum battery reserve for the home; and
5. a transparent comparison of alternative choices.

## Codex and GPT-5.6 collaboration

The human retained the consequential product decisions: comfort before savings, advice rather than actuation, visible uncertainty, privacy-safe publication and explainable recommendations that can be overridden.

Codex with GPT-5.6 accelerated the implementation by:

- translating the connected-home concept into the Today → Insight → Decide → Explore journey;
- implementing the coordinated recommendation and scenario controls;
- challenging double counting and overly precise savings claims;
- separating modeled outcomes from measured facts;
- building the video narrative, 90-second presentation and interactive proof;
- creating privacy, network and mutation boundaries; and
- preparing reproducible setup and validation evidence.

The result came from repeated questioning, correction and testing rather than accepting a first plausible answer.

## Build Week scope and provenance

WARM began before the event as a private personal energy-learning prototype. During the Build Week submission period, the work was transformed into this separate public competition artifact:

- all private household records and supplier-specific integrations were removed;
- the fragmented prototype was reorganized into a coherent decision journey;
- synthetic four-view and jury-presentation experiences were created;
- the public artifact was made dependency-free and credential-free; and
- explicit test, safety and documentation boundaries were added.

The commit history in this repository records the public competition work. The Devpost submission also includes the required Codex `/feedback` Session ID from the primary build thread; that identifier is intentionally not stored in the source repository.

## Data and limitations

All visible household values are fictional and deterministic. Monetary figures are illustrative modeled values, not tariffs, quotations or universal savings claims. Real-world recommendations would require household consent, current local data, equipment constraints and a verification loop.

## License

Released under the [MIT License](LICENSE).
