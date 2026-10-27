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

- `/` Home preview
- `/editor` Resume editor
- `/directory` Job-title directory
- `/resume_tmpl/:jobTitle` Template preview for a specific role

## Template System

- Template components live in `src/components/ResumeTemplates.tsx` and `src/components/templates/`.
- Template metadata (name, description, ATS flag, full-bleed) lives in `src/constants/templates.ts`.
- Design settings (`ResumeData.design`: accent, font, scale) are applied by `ResumePreview` as CSS variables (`--rs-accent`, `--font-*`) plus `zoom`; see `src/constants/design.ts`.
- To add a template:
  1. Create a component in `src/components/templates/` whose root is `flex-1` and reads `var(--rs-accent, <default>)`.
  2. Export it in `ResumeTemplates.tsx` and register it in `ResumeTemplateRenderer.tsx`.
  3. Add it to `TEMPLATE_CATALOG`; check it at `/dev/templates?t=<id>` with the default, long and sparse fixtures.

## Job Titles and Role Examples

- `src/data/jobTitles.json` contains 640 titles grouped by category.
- `scripts/jobtitles-validate.mjs` checks duplicates and slug collisions.
- `scripts/jobtitles-import.mjs` supports bulk import.
- `src/data/roleExamples.ts` provides sample content for common roles.
- `src/data/personas.ts` assigns deterministic persona names for previews.

## AI Integration

- `src/services/aiService.ts` sends the Worker-injected `ai-client-token` to fetch `/api/ai/session`, then calls `/api/ai` with the signed session token.
- `worker/index.ts` validates origin + fetch metadata, verifies client attestation token, enforces signed session token + request id, applies IP/session/global rate limits (Durable Object-backed), then calls Gemini using server secret (`GEMINI_API_KEY`).
- AI requests are authenticated with short-lived signed session tokens and run on the Workers AI binding (`env.AI`); no third-party API key is involved.

## SEO Pipeline

- `src/hooks/useSeo.ts` applies meta tags and JSON-LD at runtime.
- `scripts/seo-postbuild.mjs` generates static HTML for `/directory` and `/resume_tmpl/*` routes.
- The postbuild step also generates Open Graph share images (PNG) under `dist/og`.
- Sitemap and canonical URLs use `SITE_URL` or `VITE_SITE_URL`.

## Deployment

- Build output is `dist`.
- Cloudflare Pages or Workers are supported via `wrangler.jsonc`.
- Any static host can serve the build output.
