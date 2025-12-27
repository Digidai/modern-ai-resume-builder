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

1. Create or edit a template component in `src/components/templates/` or `src/components/ResumeTemplates.tsx`.
2. Export the new template in `src/components/ResumeTemplates.tsx`.
3. Add the template ID to the lists in:
   - `src/components/ResumeEditor.tsx`
   - `src/components/TemplateSelector.tsx`
4. Verify the template renders correctly in preview and print mode.

## Updating Job Titles

1. Edit `src/data/jobTitles.json`.
2. Validate: `npm run jobtitles:validate`.
3. Build: `npm run build` (SEO pages + share images depend on job titles).

## SEO + Social Sharing

- `scripts/seo-postbuild.mjs` generates static HTML, sitemap, and share images.
- Set `SITE_URL` to ensure canonical URLs and OG tags are correct.
- Optional: set `SEO_WRITE_PUBLIC=1` to write generated assets into `public/` for local testing.

## AI Prompts

- Prompts live in `src/services/geminiService.ts`.
- Keep prompts concise and resume-focused.

## Pull Requests

- Describe the change clearly and include screenshots for UI changes.
- If you touched job titles, run `npm run jobtitles:validate`.
- If you touched templates or layout, verify print preview.

## Code of Conduct

By participating, you agree to the Code of Conduct in `CODE_OF_CONDUCT.md`.
