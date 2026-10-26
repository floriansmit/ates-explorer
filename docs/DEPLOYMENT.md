# Deployment

## GitHub Pages

Live app: https://floriansmit.github.io/ates-explorer/

The repository includes `.github/workflows/pages.yml`. Pushes to main run the tests and static build, upload dist/ and deploy through GitHub Pages. Pull requests run tests/build only. No npm dependencies or repository secrets are needed.

One-time repository setup: Settings → Pages → Build and deployment → Source → **GitHub Actions**. Then rerun the Pages workflow or push a commit. The deployment job links its actual page URL in the Actions run. If Pages is not enabled, the configure step reports a missing Pages site; this is an administration setting, not an application build failure. The workflow also supports a manual run.

All application asset/module links are relative, so the `/ates-explorer/` project subpath is supported. The module worker uses the same origin and path. Do not add an unrelated custom domain/CNAME. Live geology requests continue directly to provider services and depend on their availability, browser CORS and coverage.

The generated source ZIP comes from scripts/build.mjs; dist/ is not committed. No server-side runtime, database, API key or application user account is required.

## ChatGPT Sites

Existing app: https://ates-explorer.floriansmit88.chatgpt.site/

`.openai/hosting.json` retains its project identity and static output directory. Use the supported Sites source/build/package/deploy workflow to update that deployment. Pages deployment does not update Sites automatically, and its audience/settings are separate. Do not copy credentials into the manifest.
