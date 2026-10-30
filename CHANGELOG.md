# Changelog

All notable changes to this project will be documented in this file.

## Unreleased

- Five ATS-friendly templates: Plain (the most basic black-and-white resume), Text (text only, no rules or colour), Graduate (education and skills first), Wall Street (investment-banking format) and Scholar (academic CV). 49 templates in total.
- Publications: a new editor section (title, authors, venue, year, DOI) for academic and research CVs, shown by Scholar, Academic, Plain, Text and Graduate, with your name bolded in the author list. Accepted by the schema, MCP and API, and imported from JSON Resume.
- Grants and awards (title, funder, year, amount or role) and Talks (title, event, location, year): two more academic CV sections, shown by the same templates as Publications. Scholar puts their years in its gutter. Accepted by the schema, MCP and API; JSON Resume `awards` are imported.
- Import LaTeX (.tex): paste or upload a LaTeX resume or CV (moderncv, Awesome-CV, Jake's Resume and others); AI converts it, including publications, grants, talks and teaching, and you check it as pages before it replaces the resume (Undo restores the old one).
- Import from ORCID reads up to 4,000 works (was 300), four requests at a time; a longer record keeps the newest 4,000 and says how many it lists.
- Import from ORCID shows its progress (looking up the record, then works read so far out of the total). Open in Overleaf says that the project opens and compiles in a new tab.
- Slow actions show progress. AI Improve and Write fill the field as the AI writes (the original text comes back if a request fails part-way) and show how long they have been working. Download PDF shows a card with its step (prepare, render, save), the time taken, and whether it fell back to an image PDF made in the browser.
- LaTeX import shows its progress: the AI's reply streams in, and the dialog shows the current step (send, read, write), the section being written, the entries found so far, a progress bar and the elapsed time.
- The editor preview now shows separate A4 pages exactly as the PDF prints them (where entries move to the next page, repeated margins and backgrounds). A Continuous toggle keeps the single long sheet with dashed page lines; the choice is remembered.
- Import publications from BibTeX (paste or upload a .bib from Google Scholar, DBLP, Zotero) or from a public ORCID record, with a review list that skips works already on the resume. New `/api/orcid` endpoint.
- Open in Overleaf and Download LaTeX (.tex): the resume as a standalone LaTeX document (pdfLaTeX, or XeLaTeX with xeCJK for Chinese/Japanese/Korean text).
- Latin Modern (the default LaTeX typeface) as a font option.
- Tabs opened before a deploy reload once instead of failing to load a page.
- Teaching (course, role, institution, year) for courses taught and TA roles, shown by the same templates.
- Faster first load: each page is its own chunk, so the main script is 216 KB (68 KB gzipped) instead of 503 KB. The pre-rendered page stays visible until its chunk is ready.
- Photo CVs: an optional photo in the editor (cropped to 3:4 and compressed in the browser, never uploaded) and four photo templates: Europa (Europass style), Tokyo (rirekisho-style ruled form), Jade (Chinese-style ID photo header) and Portrait (round photo sidebar). Halo shows the photo instead of initials. The resume schema, MCP and API accept `photo` (and JSON Resume `basics.image` data URLs); `list_templates` marks photo templates. 44 templates in total.
- Job pages: 274 new titles and 2 new families (Security & Facilities, Students & Career Changes), 1,204 titles in 21 families, each with an example resume that fits one A4 page in every template.
- Site redesign in a refined neutral style: near-white background with white cards, soft layered shadows, rounded corners, Inter headings and body text, one slate-blue accent, a new logo mark and icons. Gradients, sparkle badges, pills and purple are gone from the site; the job page picker shows 8 templates with "Show all", and the agent prompt is a collapsible "Use with an AI agent" panel.
- No template defaults to purple any more (Modern, Halo and Sidebar use ocean blue; Timeline and Altitude teal; Tech green; Ginto rust; Moda wine; Path ochre; Pop orange). Preview images are regenerated.
- Every example resume fits on one A4 page in every template: examples were trimmed where needed and carry per-template fit scales (`npm run roles:fit:apply`), applied to previews, thumbnails and "Start from example". Mono and Cast no longer spill onto page 2 with the default sample, and Lateral no longer leaves page 1 empty on long resumes.
- MCP and HTTP API: page counts and previews now use print layout (no more "2 pages" for a resume that prints on one); job titles resolve common phrasings ("nurse", "RN", "Front-End Developer", "Sr …"); `ats_only` accepts `1`/`"true"`; link warnings; `/api/agent/example` is documented in OpenAPI, llms.txt and SKILL.md.
- Fixed: directory search ignores extra spaces and ranks word-start matches first; "Use my resume" keeps your job title; invalid link URLs are no longer printed; JSON Resume profiles with only a username import; skill groups no longer split on commas inside parentheses; the resume name is no longer an extra `<h1>` on site pages; mobile link rows fit; the black accent swatch is visible in dark mode.

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
