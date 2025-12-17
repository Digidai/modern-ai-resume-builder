<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Modern AI Resume Builder

A modern, AI-powered resume builder with real-time preview and Gemini AI text enhancement capabilities.

## Features

- **AI-Powered Text Enhancement** - Leverage Google Gemini 2.5 Flash to polish your resume content
  - Auto-generate professional summaries based on your role and skills
  - Improve job descriptions with action verbs and quantifiable metrics
  - Enhance project descriptions for maximum impact

- **7 Professional Templates**
  - Modern - Clean design with accent colors
  - Minimalist - Simple and elegant
  - Sidebar - Two-column layout
  - Executive - Traditional professional look
  - Creative - Bold and distinctive
  - Compact - Space-efficient design
  - Tech - Developer-focused styling

- **Real-time Preview** - See changes instantly as you edit

- **Export Options**
  - Download as PDF (via browser print)
  - Export data as JSON for backup

- **Responsive Design** - Works seamlessly on desktop and mobile

## Tech Stack

- React 19
- TypeScript
- Vite 6
- Tailwind CSS
- Google Gemini API (@google/genai)

## Getting Started

### Prerequisites

- Node.js (v18 or higher recommended)
- (Optional) A Gemini API key from [Google AI Studio](https://aistudio.google.com/) to use AI features

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/modern-ai-resume-builder.git
   cd modern-ai-resume-builder
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. (Optional) Provide your Gemini API key:

   - Recommended: run the app and enter your key when prompted (saved locally in your browser).
   - Or set it via Vite env for local dev by creating `.env.local`:
     ```
     VITE_GEMINI_API_KEY=your_gemini_api_key_here
     ```
     Note: any `VITE_` variable is embedded into the client bundle.

4. Start the development server:
   ```bash
   npm run dev
   ```

5. Open http://localhost:5173 in your browser

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production (includes SEO postbuild) |
| `npm run preview` | Preview production build |
| `npm run deploy` | Deploy to Cloudflare Workers |
| `npm run build:deploy` | Build + deploy (Wrangler) |
| `npm run jobtitles:validate` | Validate job title list (dedupe/slug collisions) |
| `npm run jobtitles:import -- --input <file>` | Bulk import job titles into `src/data/jobTitles.json` |

## Adding Job Titles (新增职位)

Job titles are the source of truth for:

- The `/directory` page
- SEO pre-rendered pages under `/resume_tmpl/<job-title-slug>`
- `sitemap.xml`, `_redirects`, and other SEO assets generated at build time

### Rules (必须满足)

- **No duplicates**: job titles must be globally unique (across all categories).
- **No slug collisions**: different titles must not produce the same slug.
- **More titles = more pages**: `npm run build` generates one HTML page per title under `dist/resume_tmpl/<slug>/index.html`.

> Tip: `npm run build` (and `npm run jobtitles:validate`) will fail fast if duplicates or slug collisions are detected.

### Method A: Edit `src/data/jobTitles.json` manually (少量新增)

1. Add a title under the right category (or create a new `{ "name": "...", "titles": [] }` category).
2. Validate + rebuild SEO outputs:
   ```bash
   npm run jobtitles:validate
   npm run build
   ```
3. Preview locally (`npm run preview` prints the URL/port), then check:
   - `/directory`
   - `/resume_tmpl/<slug>`

### Method B: Bulk import (recommended) (批量新增)

Use the importer for large batches: `scripts/jobtitles-import.mjs`.

#### TXT format (one title per line, optional `[Category]` sections)

Example `titles.txt`:
```txt
[Engineering]
Staff Software Engineer
Senior Frontend Developer

[Marketing & Growth]
Growth Hacker
SEO Manager
```

Run:
```bash
# Preview changes without writing
npm run jobtitles:import -- --input titles.txt --dry-run

# Apply changes
npm run jobtitles:import -- --input titles.txt
```

If your TXT file has no `[Category]` headers, provide a default category:
```bash
npm run jobtitles:import -- --input titles.txt --category "Engineering"
```

#### CSV/TSV format (`category,title`)

Example `titles.csv`:
```csv
Engineering,Staff Software Engineer
Marketing & Growth,Growth Hacker
```

Run:
```bash
npm run jobtitles:import -- --input titles.csv --format csv
```

Importer options:
- `--dry-run` to preview summary only
- `--no-sort` to keep input order (default sorts titles within each category)

After importing:
```bash
npm run jobtitles:validate
npm run build
```

### SEO + Canonical Domain (重要)

`npm run build` runs `scripts/seo-postbuild.mjs` and generates `dist/sitemap.xml`, canonical tags, and Open Graph URLs.
Set `SITE_URL` in your build environment so the generated URLs use your production domain (defaults to `https://genedai.cv`).

### Sample Names per Job Title (职位页姓名自动不同)

Each job title page uses a deterministic persona so the preview full name differs per role automatically (no manual work needed).

## Deploying to Cloudflare

### Option A: Cloudflare Workers (Wrangler)

This repo includes `wrangler.jsonc` configured to deploy the built `./dist` directory as static assets.

Tip: set `SITE_URL` (e.g. `https://your-domain.com`) in your build environment so canonical URLs, Open Graph URLs, and `sitemap.xml` are generated correctly.

1. Build:
   ```bash
   npm run build
   ```

2. Deploy:
   ```bash
   npm run deploy
   ```

   Or in one command:
   ```bash
   npm run build:deploy
   ```

### Option B: Cloudflare Pages

In Cloudflare Pages settings:

- Build command: `npm run build`
- Build output directory: `dist`

## Project Structure

```
modern-ai-resume-builder/
├── src/
│   ├── components/         # UI components (editor/preview/templates)
│   ├── hooks/              # React hooks (local storage, etc.)
│   ├── services/           # Gemini AI integration
│   ├── data/               # Job titles + role examples
│   ├── App.tsx             # Main application component
│   ├── index.tsx           # Entry point
│   └── types.ts            # TypeScript type definitions
├── scripts/                # SEO + content generation scripts
├── index.html              # HTML template
└── wrangler.jsonc          # Cloudflare Workers deploy config
```

## License

MIT
