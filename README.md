<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />

# Modern AI Resume Builder

[![MIT License](https://img.shields.io/badge/License-MIT-green.svg)](https://opensource.org/licenses/MIT)
[![React](https://img.shields.io/badge/React-19.x-61DAFB?logo=react&logoColor=white)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4.x-38B2AC?logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Vite](https://img.shields.io/badge/Vite-6.x-646CFF?logo=vite&logoColor=white)](https://vite.dev/)
[![Gemini AI](https://img.shields.io/badge/Gemini-AI_Powered-8E75B2?logo=google&logoColor=white)](https://ai.google.dev/)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](http://makeapullrequest.com)
[![Cloudflare](https://img.shields.io/badge/Deploy-Cloudflare-F38020?logo=cloudflare&logoColor=white)](https://pages.cloudflare.com/)

**ModernCV is an AI-powered resume builder with 28 templates, real-time preview, and 640 job-title pages for SEO.**

[Live Demo](https://genedai.cv) | [Report Bug](../../issues) | [Request Feature](../../issues)

</div>

---

## Why This Project?

ModernCV helps job seekers build professional resumes quickly while giving HR teams a consistent, template-driven way to review and share role-specific layouts. It runs entirely in the browser, keeps data local, and can be deployed as a static site.

## Who Is It For?

- Job seekers who want fast, polished resumes with AI-assisted wording.
- Career coaches who need reusable templates and consistent output.
- HR and recruiting teams that want role-based template previews and shareable resume layouts.

## Highlights

- 28 professionally designed resume templates.
- 640 job titles with SEO-friendly, pre-rendered pages.
- Gemini AI assistance for summaries and experience bullet improvements.
- Local-first data storage (localStorage); no backend required.
- Print-ready A4 layout and PDF export via browser print.
- JSON export for portability or integration with other tools.
- Light and dark themes.

## Templates

ModernCV ships with 28 templates:

Modern, Minimalist, Sidebar, Executive, Creative, Compact, Tech, Professional, Academic, Elegant, Swiss, Opal, Wireframe, Berlin, Lateral, Iron, Ginto, Symmetry, Bronx, Path, Quartz, Silk, Mono, Pop, Noir, Paper, Cast, Moda.

## Preview

![ModernCV Preview](./public/og-image.png)

## Features

### Resume Builder
- Real-time editor + preview with responsive layout.
- Template selector with instant style changes.
- PDF export via `pdf-lib`.
- JSON export for backup or reuse.

### AI Assistance (Gemini)
- Generate a professional summary based on role and skills.
- Improve experience bullets with action verbs and measurable impact.
- Client-side integration using `@google/generative-ai` (Gemini 2.0 Flash experimental).

### Job Title Directory and SEO
- `/directory` route with searchable categories (640 titles).
- SEO postbuild script generates static HTML and sitemap entries.
- Structured data (JSON-LD) on directory and job pages.

### Privacy and Data
- Resume data lives in localStorage.
- AI requests send only the selected text to Gemini.
- API key can be provided in the UI and stored locally.

## Tech Stack

| Category | Technology |
|----------|------------|
| Framework | React 19 |
| Language | TypeScript 5.8 |
| Build Tool | Vite 6 |
| Styling | Tailwind CSS 4 |
| Routing | React Router 6 |
| AI | Google Gemini API |
| PDF | pdf-lib |
| Deployment | Cloudflare Pages/Workers |

## Getting Started

### Prerequisites

- Node.js 18+ recommended
- npm
- Optional: Gemini API key from Google AI Studio

### Quick Start

```bash
# Clone the repository
git clone https://github.com/yourusername/modern-ai-resume-builder.git

# Navigate to the project
cd modern-ai-resume-builder

# Install dependencies
npm install

# Start development server
npm run dev

# Open http://localhost:5173 in your browser
```

### Environment Variables

Create a `.env.local` file if needed:

```env
# Optional: Gemini API key for local development
VITE_GEMINI_API_KEY=your_gemini_api_key_here

# Optional: runtime canonical site URL for SEO tags
VITE_SITE_URL=https://your-domain.com

# Optional: build-time site URL for SEO postbuild assets
SITE_URL=https://your-domain.com
```

Notes:
- `VITE_` variables are embedded into the client bundle.
- You can also enter the Gemini API key directly in the UI; it is stored in localStorage.

## Scripts Reference

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production and run SEO postbuild |
| `npm run preview` | Preview the production build |
| `npm run seo:postbuild` | Run SEO postbuild only |
| `npm run jobtitles:validate` | Validate job titles (duplicates, slug collisions) |
| `npm run jobtitles:import` | Bulk import job titles |
| `npm run deploy` | Deploy to Cloudflare Workers |
| `npm run build:deploy` | Build and deploy in one command |

## Project Structure

```
modern-ai-resume-builder/
├── .github/                    # GitHub templates
├── public/                     # Static assets (icons, OG image)
├── scripts/                    # SEO and job title scripts
├── src/
│   ├── components/             # UI components and templates
│   ├── contexts/               # React contexts
│   ├── data/                   # Job titles, personas, role examples
│   ├── hooks/                  # Custom React hooks
│   ├── services/               # Gemini AI integration
│   ├── utils/                  # Utility functions
│   ├── App.tsx                 # Routes and page layout
│   └── types.ts                # TypeScript types
├── ARCHITECTURE.md             # Architecture details
├── CHANGELOG.md                # Version history
├── CONTRIBUTING.md             # Contribution guide
├── CODE_OF_CONDUCT.md          # Community guidelines
├── ROADMAP.md                  # Product roadmap
└── SECURITY.md                 # Security policy
```

## Adding Job Titles

Job titles power the `/directory` page and generate SEO pages under `/resume_tmpl/<slug>`.

### Quick Add (Manual)

1. Edit `src/data/jobTitles.json`
2. Validate: `npm run jobtitles:validate`
3. Build: `npm run build`

### Bulk Import

```bash
# TXT format (one title per line)
npm run jobtitles:import -- --input titles.txt --dry-run

# CSV format (category,title)
npm run jobtitles:import -- --input titles.csv --format csv
```

## Deployment

### Cloudflare Pages (Recommended)

1. Connect your GitHub repository to Cloudflare Pages
2. Configure build settings:
   - Build command: `npm run build`
   - Build output directory: `dist`

### Cloudflare Workers

```bash
npm run build:deploy
```

### Other Platforms

The `dist` folder can be deployed to any static hosting (Vercel, Netlify, GitHub Pages, S3 + CloudFront).

## Contributing

We welcome contributions. Please see `CONTRIBUTING.md` for details.

## Roadmap

See `ROADMAP.md` for planned features and priorities.

## Community

- Issues: [Report bugs or request features](../../issues)
- Discussions: [Share ideas or ask questions](../../discussions)
- Security: See `SECURITY.md`

## License

Distributed under the MIT License. See `LICENSE` for more information.

## Acknowledgments

- Google Gemini for AI capabilities
- Tailwind CSS for styling
- Vite for the build tool
- Cloudflare for hosting

<div align="center">

**[Back to Top](#modern-ai-resume-builder)**

Made with love for job seekers everywhere

</div>
