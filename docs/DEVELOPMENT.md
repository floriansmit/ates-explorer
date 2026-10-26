# Development and Codex setup

## Prerequisites and commands

Use Node.js 22 or newer for the documented workflow (tests also use features available in Node 18+), plus Python 3. The app has no npm runtime dependencies and no install step is required.

```sh
git clone https://github.com/floriansmit/ates-explorer.git
cd ates-explorer
npm test
npm run build
npm start
```

Open http://localhost:8080 over HTTP. `npm start` serves the source root; to inspect generated output, run `python3 -m http.server 8080 --directory dist`. Do not open index.html via file://: ES modules and Web Workers require a suitable HTTP origin. Live lookup needs internet access and provider CORS. No API secrets are needed for current adapters. The KDS transition token in location.js is a documented public service token, not a private credential; its service lifetime may change.

## Modules

| File | Responsibility |
| --- | --- |
| app.js / index.html / style.css | UI, input invalidation, scenario import/export |
| countries.js / location.js | Provider metadata, coordinate/address/map UX |
| regis.js / fohm.js | Dutch/Danish profile retrieval and parsing |
| custom-profile.js | Manual depth/elevation normalization and validation |
| reservoirs.js | Screen geometry, transmissivity and flow allocation |
| engine.js | Fast monthly hydraulic/energy screening |
| thermal.js / thermal-worker.js | Transient solver and worker execution |
| snapshots.js / thermal-viewer.js | Saved output layout, timeline and rendering |
| scripts/build.mjs | Static dist output and source ZIP |
| tests/ | 37 numerical, parser and profile checks at v0.6.0 |

## Extend a provider

Return a profile with unique unit codes, finite positive-up top/base elevations, explicit datum/CRS, thickness, lithology and nullable hydraulic properties. Retain model version, retrieval time, point/cell information and evidence. Never substitute default Kh for an absent measurement. Keep overlapping source models in distinct selectable groups. Guard stale location requests and clear connected results when country/model/profile changes. Use the EGT integration document as a proposed data contract, not a description of an existing endpoint.

## Coding expectations

Keep calculations in pure modules where possible. Add tests for changed numerical or data-normalization behaviour. Preserve clear source provenance and units. Do not label experimental predictions as validated, infer a Danish vertical datum, count clay as a connected screen or convert nodata into zero conductivity. Keep the 0.001 head-gradient step. Avoid exposing credentials in source, logs or documentation.

## Deployments

The GitHub Pages workflow tests and builds the application, then publishes dist/. ChatGPT Sites is a separate deployment; GitHub updates do not automatically publish it. `.openai/hosting.json` identifies the original Sites project and is not used by Pages. Never put generated dist/, access tokens or temporary archives into the GitHub source commit.

No application licence is selected. Vendored Leaflet and Proj4 licences are retained. Selecting an open-source licence is an owner decision.
