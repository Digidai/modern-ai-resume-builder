# Changelog

All notable changes to this project will be documented in this file.

## Unreleased

- Fixed AI in production: HTML now runs through the Worker (`run_worker_first`) so it receives the client token and CSP; AI moved from Gemini to Cloudflare Workers AI (`env.AI`, default `@cf/zai-org/glm-5.3-flash`), endpoints renamed to `/api/ai` and `/api/ai/session`, signing secret renamed to `AI_SIGNING_SECRET`.
- Added six templates modelled on proven designs: Classic (Jake's Resume), Ivy (Harvard), Ledger (moderncv banking), Vanguard (Awesome-CV), Duo (Deedy) and Timeline.
- Reworked all 28 existing templates to one standard: readable sizes (body ≥ 13.5px), ≥ 12mm margins, contrast-safe accents, consistent date slots, grouped skills ("Category: items"), clean empty states, and one-page defaults.
- Added style controls in the editor: accent colour presets plus custom hex with a contrast check, 10 self-hosted fonts, text size, and "Fit to one page".
- Template picker now shows a description and an ATS badge; catalog reordered with ATS-friendly classics first.
- PDF export now renders the exact preview on the server (`/api/pdf`, Cloudflare Browser Rendering) as a vector PDF for every template and style; the @react-pdf twins and their Roboto files were removed. The browser image export remains as a fallback.
- Cut the initial JS bundle from 2.35 MB to 315 KB by loading PDF export code on demand.
- Added a CI workflow (typecheck, tests, build) and fixed the existing type error.

- Updated README to match current features and scripts.
- Added architecture, roadmap, and community documentation.
- Added GitHub issue and PR templates.
