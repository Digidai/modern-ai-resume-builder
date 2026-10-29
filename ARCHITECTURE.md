# Architecture

ModernCV is a local-first resume builder. Core editing runs in the browser and persists to localStorage, while AI actions are proxied through a server-side endpoint for safer key handling.

## Goals

- Zero backend requirement for core editing functionality.
- Fast authoring with real-time preview.
- Strong SEO through pre-rendered job-title pages.
- Simple, extensible template system.

## System Overview

- UI: React app with routes for home, editor, directory, and job templates.
- State: Resume data stored in React state and persisted to segmented browser storage (`resumeData:v2:*`) with debounced writes. Sensitive fields use session storage by default.
- Rendering: Preview uses a template renderer that lazily maps template IDs to components.
- AI: Frontend reads a Worker-injected client attestation token, requests a short-lived signed session token, then calls the Worker's `/api/ai` endpoint, which runs Cloudflare Workers AI.
- SEO: Runtime meta tags via `useSeo` and build-time static pages via `seo-postbuild`.

## Core Data Flow

1. User edits resume in `ResumeEditor`.
2. `useResumeData` persists changed fields to segmented browser storage keys (`localStorage` + `sessionStorage` scopes).
3. `ResumePreview` renders the current data through `ResumeTemplateRenderer`.
4. Optional AI actions call `aiService` and update resume content.

## Routing

- `/` Home (product overview, template showcase, FAQ)
- `/editor` Resume editor; `?template=<id>` preselects a template
- `/templates` Template gallery; `/templates/:templateId` template detail
- `/directory` Job-title directory
- `/resume_tmpl/:jobTitle` Template preview and writing guide for a specific role
- `*` Not-found view. The Worker returns status 404 for any path without a prerendered page.

`ScrollManager` in `App.tsx` scrolls to the top on new navigations, to `#hash` targets when present, and leaves back/forward to the browser.

## Template System

- Pages are lazy-loaded chunks registered in `src/routes.tsx` (add new routes there and in `App.tsx`). `index.tsx` loads the current page's chunk before mounting, so the pre-rendered HTML stays on screen until React replaces it.
- Template components live in `src/components/ResumeTemplates.tsx` and `src/components/templates/`.
- Template metadata (name, description, ATS flag, full-bleed) lives in `src/constants/templates.ts`.
- Design settings (`ResumeData.design`: accent, font, scale) are applied by `ResumePreview` as CSS variables (`--rs-accent`, `--font-*`) plus `zoom`; see `src/constants/design.ts`.
- To add a template:
  1. Create a component in `src/components/templates/` whose root is `flex-1` and reads `var(--rs-accent, <default>)`.
  2. Export it in `ResumeTemplates.tsx` and register it in `ResumeTemplateRenderer.tsx`.
  3. Add it to `TEMPLATE_CATALOG` (`photo: true` if it shows `data.photo` via `Portrait`, `publications: true` if it renders `data.publications`, `data.awards` and `data.talks` via `Citation`, `AwardLine` and `TalkLine`); check it at `/dev/templates?t=<id>` with the default, long and sparse fixtures.

## Job Titles and Role Examples

- `src/data/roles/<family>.json` is the source of truth for job titles: one example resume per title, plus a `guide` for new families. `npm run roles:sync` merges them into `src/data/jobTitles.json` (1,204 titles, 21 families) and `src/data/roleGuides.json`.
- `scripts/seo-postbuild.mjs` pre-renders each example into its job page and writes `/examples/<slug>.json` (agents) and `/role-examples/<slug>.json` (the page preview). In dev, `src/data/roleExamples.ts` reads the source files instead.
- `scripts/jobtitles-validate.mjs` checks duplicates and slug collisions.
- `scripts/jobtitles-import.mjs` supports bulk import.
- `src/data/personas.ts` assigns each job title a unique persona name from a hash of its slug, so adding titles doesn't rename existing pages (or change their measured fit).

## AI Integration

- `src/services/aiService.ts` sends the Worker-injected `ai-client-token` to fetch `/api/ai/session`, then calls `/api/ai` with the signed session token.
- `worker/index.ts` validates origin + fetch metadata, verifies client attestation token, enforces signed session token + request id, applies IP/session/global rate limits (Durable Object-backed), then calls Workers AI.
- The Worker injects the client token, cookie and CSP nonce into every HTML response, so HTML is served with `cache-control: private, no-cache` and without ETags; a revalidated (304) page would otherwise pair a stale token with a new cookie.
- AI requests are authenticated with short-lived signed session tokens and run on the Workers AI binding (`env.AI`); no third-party API key is involved.

## SEO Pipeline

- `src/hooks/useSeo.ts` applies meta tags and JSON-LD at runtime.
- `scripts/seo-postbuild.mjs` pre-renders `/`, `/directory`, `/templates`, `/templates/*` and `/resume_tmpl/*` with meta tags and JSON-LD, and writes `sitemap.xml`, `robots.txt`, `404.html`, `llms.txt`, `llms-full.txt`, `templates.json` and `resume.schema.json`.
- Role guides come from `src/data/roleGuides.json` through `src/shared/roleGuide.mjs`, which both the React page (`RoleGuide.tsx`) and the build script use, so the prerendered text matches the app.
- The template list is read from `src/constants/templates.ts`; the home FAQ from `src/data/homeFaq.json`.
- The postbuild step also generates Open Graph share images (PNG) under `dist/og`.
- Sitemap and canonical URLs use `SITE_URL` or `VITE_SITE_URL`.

## Deployment

- Build output is `dist`.
- Cloudflare Pages or Workers are supported via `wrangler.jsonc`.
- Any static host can serve the build output.

## Agent Mode

- `worker/agent.ts` serves a stateless MCP server over Streamable HTTP at `/mcp` and the same tools as REST under `/api/agent/` (spec at `/openapi.json`).
- `render_preview` and `render_pdf` print the `/render` page (`src/views/RenderView.tsx`) with Cloudflare Browser Rendering, so agents get exactly the editor's output.
- `get_example_resume` reads `/examples/<slug>.json` through the `ASSETS` binding.
- Editor handoff links carry the resume in the URL fragment (`/editor/#resume=<payload>`); the encoding lives in `src/shared/resumeLink.ts`.
- Prompts shown on template, job and `/agents/` pages come from `src/shared/agentPrompt.mjs`, which also lists the MCP tools for the build script.
- The agent skill lives in `skills/moderncv-resume/SKILL.md` and is copied to `dist/skills/`.
