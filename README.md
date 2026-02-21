<div align="center">

# ModernCV - AI Resume Builder

<img width="100" height="100" src="https://img.icons8.com/fluency/100/resume.png" alt="ModernCV Logo"/>

[![MIT License](https://img.shields.io/badge/License-MIT-green.svg)](https://opensource.org/licenses/MIT)
[![React](https://img.shields.io/badge/React-19.x-61DAFB?logo=react&logoColor=white)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4.x-38B2AC?logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Vite](https://img.shields.io/badge/Vite-6.x-646CFF?logo=vite&logoColor=white)](https://vite.dev/)
[![Gemini AI](https://img.shields.io/badge/Gemini-AI_Powered-8E75B2?logo=google&logoColor=white)](https://ai.google.dev/)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](http://makeapullrequest.com)
[![Cloudflare](https://img.shields.io/badge/Deploy-Cloudflare-F38020?logo=cloudflare&logoColor=white)](https://pages.cloudflare.com/)

**ModernCV is an AI-powered resume builder with 28 templates, real-time preview, and 640 job-title pages for SEO.**

[Live Demo](https://genedai.cv) | [Report Bug](../../issues) | [Request Feature](../../issues) | [Architecture](./ARCHITECTURE.md) | [Roadmap](./ROADMAP.md)

[English](#why-this-project) | [中文](#功能特性)

</div>

---

## Table of Contents

- [Why This Project?](#why-this-project)
- [Who Is It For?](#who-is-it-for)
- [Highlights](#highlights)
- [Templates](#templates)
- [Preview](#preview)
- [Features](#features)
- [SEO & Social Sharing](#seo--social-sharing)
- [Getting Started](#getting-started)
- [Scripts Reference](#scripts-reference)
- [Project Structure](#project-structure)
- [Adding Job Titles](#adding-job-titles)
- [Deployment](#deployment)
- [Contributing](#contributing)
- [Roadmap](#roadmap)
- [Community](#community)
- [License](#license)

## Why This Project?

ModernCV helps job seekers build professional resumes quickly while giving HR teams a consistent, template-driven way to review and share role-specific layouts. Editing stays local-first in the browser, while AI requests are routed through a server-side proxy for safer key management.

## Who Is It For?

- Job seekers who want fast, polished resumes with AI-assisted wording.
- Career coaches who need reusable templates and consistent output.
- HR and recruiting teams that want role-based template previews and shareable resume layouts.

## Highlights

- 28 professionally designed resume templates.
- 640 job titles with SEO-friendly, pre-rendered pages.
- Gemini AI assistance for summaries and experience bullet improvements.
- Local-first data storage with debounced segmented persistence for resume editing.
- Optional AI proxy via Cloudflare Worker for server-side Gemini key handling.
- Print-ready A4 layout and PDF export via browser print.
- JSON export for portability or integration with other tools.
- Light and dark themes.

## 功能特性

- **28 套专业模板** - 涵盖多种行业和风格的精心设计模板
- **640 个职位页面** - SEO 优化的职位目录页面
- **实时预览** - 输入内容时即时查看简历更新
- **AI 智能优化** - 使用 Google Gemini AI 优化和润色简历文本
- **自动生成摘要** - 根据职位和技能自动生成专业摘要
- **本地数据存储** - 数据优先保存在浏览器（分片存储 + 自动保存）
- **打印导出** - 使用 `Cmd/Ctrl + P` 或 PDF 导出功能生成高质量简历
- **JSON 导出** - 支持 JSON 格式导出，便于备份和迁移
- **明暗主题** - 支持浅色和深色主题切换
- **社交分享图** - 构建时自动生成适配职位页与目录页的分享缩略图

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
- Frontend requests a short-lived signed session via `/api/gemini/session`, then calls `/api/gemini`.
- Worker applies origin checks, session verification, and per-IP rate limiting before hitting Gemini.

### Job Title Directory and SEO
- `/directory` route with searchable categories (640 titles).
- SEO postbuild script generates static HTML and sitemap entries.
- Structured data (JSON-LD) on directory and job pages.

### Privacy and Data
- Resume data is persisted in segmented localStorage keys (`resumeData:v2:*`) with debounced writes.
- AI requests send selected text to Google Gemini for processing.
- Users must explicitly consent before AI actions are sent.
- Personal Gemini keys default to session-only storage; “remember on this device” is optional and off by default.

## SEO & Social Sharing

- Open Graph + Twitter tags are set per page (runtime + build).
- Build generates share images (1200x630 PNG) for home, directory, editor, and each job page.
- Images are generated from SVG and saved under `dist/og/**`.
- Set `SITE_URL` (build) or `VITE_SITE_URL` (runtime) to ensure correct canonical URLs.

## Usage Guide

### Editing Your Resume
1. Click **"Edit Resume"** to enter edit mode
2. Use the **tabs** to navigate between sections:
   - **Basics**: Personal details, summary, and education
   - **Experience**: Work history with AI-enhanced descriptions
   - **Skills**: Skills list and project showcase
3. Changes are autosaved locally (with visible warning if persistence fails)

### AI Features
- **Polish Text**: Click the ✨ sparkle icon on any text field to improve it with AI
- **Generate Summary**: Click "Generate with AI" to create a professional summary based on your role and skills

### Exporting
- Click **"Download PDF"** to export your resume
- Or press `Cmd/Ctrl + P` to open the print dialog and select "Save as PDF"

## Resume Sections

| Section | Description |
|---------|-------------|
| **Personal Info** | Name, title, contact details, website, LinkedIn |
| **Summary** | Professional summary (AI-generated or custom) |
| **Experience** | Work history with company, role, dates, and descriptions |
| **Education** | Schools, degrees, and graduation dates |
| **Skills** | Comma-separated list of skills |
| **Projects** | Personal or professional projects with links |

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
| SEO | JSON-LD, sitemap + OG images (sharp) |
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
# Optional: frontend override for AI proxy endpoint
# Defaults to /api/gemini
VITE_AI_PROXY_URL=

# Optional: runtime canonical site URL for SEO tags
VITE_SITE_URL=https://your-domain.com

# Optional: build-time site URL for SEO postbuild assets
SITE_URL=https://your-domain.com

# Optional: write SEO assets to public/ for local testing
SEO_WRITE_PUBLIC=1
```

Notes:
- `VITE_` variables are embedded into the client bundle.
- Do not store service keys in `VITE_` variables.
- For Cloudflare Worker deployments, set a server secret:
  - `wrangler secret put GEMINI_API_KEY`
  - `wrangler secret put GEMINI_SIGNING_SECRET`
- For local AI proxy testing, run Worker dev and point the frontend to it:
  - `VITE_AI_PROXY_URL=http://127.0.0.1:8787/api/gemini`
  - `npx wrangler dev`
- Optional Worker vars:
  - `ALLOWED_ORIGINS` (comma-separated origins allowed to request AI sessions)
  - `AI_RATE_LIMIT_PER_MINUTE`
  - `AI_SESSION_RATE_LIMIT_PER_MINUTE`
  - `AI_SESSION_TTL_SECONDS`
- You can still enter a personal Gemini API key in the UI as a fallback. By default it is scoped to the current tab session.
- `npm run build` generates static SEO pages + OG images in `dist/og`.

## Scripts Reference

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production and run SEO postbuild |
| `npm run preview` | Preview the production build |
| `npm run test` | Run unit/integration tests (Vitest) |
| `npm run test:watch` | Run tests in watch mode |
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
# First-time only: configure server-side Gemini key
wrangler secret put GEMINI_API_KEY

# Build and deploy
npm run build:deploy
```

### Other Platforms

The `dist` folder can be deployed to any static hosting (Vercel, Netlify, GitHub Pages, S3 + CloudFront) for core resume editing.
If you need AI features, deploy an API endpoint compatible with `/api/gemini` and set `VITE_AI_PROXY_URL` when needed.

## API Reference

### Gemini Service

```typescript
// Improve existing text with AI
improveText(text: string, context: string): Promise<string>

// Generate professional summary
generateSummary(role: string, skills: string[]): Promise<string>
```

## Contributing

We welcome contributions! Please see `CONTRIBUTING.md` for details.

### Development Guidelines

- Follow the existing code style
- Write TypeScript types for new features
- Test on both desktop and mobile viewports
- Ensure AI features gracefully degrade when API is unavailable

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

**[Back to Top](#moderncv---ai-resume-builder)**

Made with love for job seekers everywhere

</div>
