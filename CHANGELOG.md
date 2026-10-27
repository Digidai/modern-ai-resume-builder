# Changelog

All notable changes to this project will be documented in this file.

## Unreleased

- Job pages: 930 titles in 19 families (290 new titles and 5 new families: Science & Research, Government & Public Service, Nonprofit & Social Services, Skilled Trades & Manufacturing, Transportation & Logistics). Every title has its own realistic example resume, pre-rendered on the page with "Copy text", "Start from example" and "Use with my resume", Occupation JSON-LD, and a unique title and description. `npm run roles:sync` merges `src/data/roles/*.json` into the title list.
- Added six templates: Meridian, Keystone and Vital (ATS-friendly), Altitude, Halo and Prism. 40 templates in total.
- Social and custom links: up to 8 extra links with auto-detected icons (GitHub, X, Dribbble, Behance, Google Scholar and more) in every template; JSON Resume `profiles` import into them.
- Agent mode: remote MCP server at `/mcp` (list_templates, get_writing_guide, get_example_resume, get_resume_schema, render_preview, render_pdf, create_editor_link), HTTP API under `/api/agent/` with `/openapi.json`, an agent skill at `/skills/moderncv-resume/SKILL.md`, editor handoff links (`/editor/#resume=…`), per-template and per-job copy-paste prompts, and an `/agents/` setup page.
- Job pages fetch one small example file (`/role-examples/<slug>.json`) instead of a whole family bundle.
- Fixed: the Government family recommended a non-existent template id (`ledger`; the Ledger template's id is `banking`); the mobile nav no longer wraps.

- Added a template gallery at `/templates/` (ATS filter) and a page per template at `/templates/<id>/` with preview images, "best for" roles, similar templates and an editor deep link (`/editor/?template=<id>`).
- Job pages now include a writing guide and five FAQs per role (sections, skills, example bullets, recruiter tips), pre-rendered at build time with FAQPage JSON-LD.
- Agent and GEO support: `llms.txt`, `llms-full.txt`, `templates.json`, `resume.schema.json`; `robots.txt` allows AI crawlers; sitemap grows to 677 URLs.
- Import accepts JSON Resume documents in addition to ModernCV backups.
- Unknown URLs and job slugs now return a real 404 page (`noindex`) instead of a redirect or a blank page.
- Fixed AI and server PDF failing after a page reload (HTML is no longer revalidated with ETags, so the client token, cookie and CSP nonce always match).
- Fixed: scroll position resets on navigation and `/#faq` links scroll to the FAQ; the mobile "Use template" bar no longer covers the footer; the header gains a mobile nav row.
- Fixed: "Fit to one page" restores the original size and explains why when the resume can't fit; the accent picker supports arrow keys; the hex field accepts values without `#` and flags invalid input.
- Fixed: pasting a multi-line skill list adds each skill; "Category: a, b" stays one group; stricter URL validation; friendlier AI error messages; no nested links in template cards.

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
