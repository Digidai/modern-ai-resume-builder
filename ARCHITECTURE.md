# Architecture

ModernCV is a static, local-first resume builder. It runs entirely in the browser, stores data locally, and uses a postbuild SEO pipeline to generate static pages for search engines.

## Goals

- Zero backend requirement for core functionality.
- Fast authoring with real-time preview.
- Strong SEO through pre-rendered job-title pages.
- Simple, extensible template system.

## System Overview

- UI: React app with routes for home, editor, directory, and job templates.
- State: Resume data stored in React state and persisted to localStorage.
- Rendering: Preview uses a template renderer that maps template IDs to components.
- AI: Client-side calls to Gemini for summary and bullet improvements.
- SEO: Runtime meta tags via `useSeo` and build-time static pages via `seo-postbuild`.

## Core Data Flow

1. User edits resume in `ResumeEditor`.
2. `useResumeData` persists changes to localStorage.
3. `ResumePreview` renders the current data through `ResumeTemplateRenderer`.
4. Optional AI actions call `geminiService` and update resume content.

## Routing

- `/` Home preview
- `/editor` Resume editor
- `/directory` Job-title directory
- `/resume_tmpl/:jobTitle` Template preview for a specific role

## Template System

- Template components live in `src/components/ResumeTemplates.tsx` and `src/components/templates/`.
- Template IDs are defined in `ResumeEditor` and `TemplateSelector`.
- To add a template:
  1. Create a new template component.
  2. Export it in `ResumeTemplates.tsx`.
  3. Add the ID to template lists in `ResumeEditor` and `TemplateSelector`.

## Job Titles and Role Examples

- `src/data/jobTitles.json` contains 640 titles grouped by category.
- `scripts/jobtitles-validate.mjs` checks duplicates and slug collisions.
- `scripts/jobtitles-import.mjs` supports bulk import.
- `src/data/roleExamples.ts` provides sample content for common roles.
- `src/data/personas.ts` assigns deterministic persona names for previews.

## AI Integration

- `src/services/geminiService.ts` wraps `@google/generative-ai`.
- The API key is provided via environment variable or user input and stored locally.
- Only the selected text is sent to Gemini for improvement.

## SEO Pipeline

- `src/hooks/useSeo.ts` applies meta tags and JSON-LD at runtime.
- `scripts/seo-postbuild.mjs` generates static HTML for `/directory` and `/resume_tmpl/*` routes.
- Sitemap and canonical URLs use `SITE_URL` or `VITE_SITE_URL`.

## Deployment

- Build output is `dist`.
- Cloudflare Pages or Workers are supported via `wrangler.jsonc`.
- Any static host can serve the build output.
