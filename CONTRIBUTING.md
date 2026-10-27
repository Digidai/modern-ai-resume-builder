# Contributing

Thanks for contributing to ModernCV. This project aims to keep a fast, local-first resume builder with a clean template system and strong SEO.

## Development Setup

1. Install dependencies: `npm install`
2. Start dev server: `npm run dev`
3. Build for production: `npm run build` (generates SEO pages + OG images)

## Project Conventions

- TypeScript strict mode is enabled.
- Keep user data local; avoid adding server dependencies without discussion.
- Prefer small, focused PRs with clear descriptions.

## Adding or Editing Templates

1. Create or edit a template component in `src/components/templates/`. Its root must be `flex-1` and read the accent from `var(--rs-accent, <default>)`.
2. Export it in `src/components/ResumeTemplates.tsx` and register it in `ResumeTemplateRenderer.tsx`.
3. Add it to `TEMPLATE_CATALOG` in `src/constants/templates.ts` (name, description, `bestFor`, ATS flag). The picker, `/templates` pages, sitemap and `templates.json` all read this list.
4. Check it at `/dev/templates?t=<id>` with the default, long and sparse fixtures, then verify print preview and the PDF export.

## Updating Job Titles

1. Add the title and a realistic example resume to its family file in `src/data/roles/` (a new family also needs a `guide`).
2. Run `npm run roles:sync`, then `npm run jobtitles:validate`.
3. Build: `npm run build` (SEO pages + share images depend on job titles).

## SEO + Social Sharing

- `scripts/seo-postbuild.mjs` generates static HTML, sitemap, share images and the agent files (`llms.txt`, `llms-full.txt`, `templates.json`, `resume.schema.json`).
- Role writing guides live in `src/data/roleGuides.json`; the home FAQ in `src/data/homeFaq.json`.
- Set `SITE_URL` to ensure canonical URLs and OG tags are correct.
- Optional: set `SEO_WRITE_PUBLIC=1` to write generated assets into `public/` for local testing.

## AI Prompts

- Prompts live in `worker/index.ts` (system prompt) and `src/services/aiService.ts`.
- Keep prompts concise and resume-focused.

## Pull Requests

- Describe the change clearly and include screenshots for UI changes.
- If you touched job titles, run `npm run jobtitles:validate`.
- If you touched templates or layout, verify print preview.

## Code of Conduct

By participating, you agree to the Code of Conduct in `CODE_OF_CONDUCT.md`.
