---
name: moderncv-resume
description: Write, design and export a professional resume with ModernCV (34 templates, vector PDF, free, no account). Use when the user asks to create, rewrite, tailor, format or export a resume or CV, or wants a resume PDF for a job application.
---

# ModernCV resume skill

ModernCV (https://genedai.cv) turns a resume written as JSON into a polished A4 PDF in one of 34 templates, and can hand the user an editor link with the resume preloaded. No account or API key is needed.

If the `moderncv` MCP server is connected, use its tools (`get_writing_guide`, `get_resume_schema`, `list_templates`, `render_preview`, `render_pdf`, `create_editor_link`). Otherwise use the HTTP API below with `curl`.

## Workflow

1. **Gather facts.** Ask for the target job title and the user's real history: roles, employers, dates, achievements with numbers, education, skills, links. Never invent employers, dates, degrees or metrics; if a number is missing, ask or leave it out.
2. **Read the guide.** `GET /api/agent/guide?job_title=<title>` returns section order, length, skills to feature, metrics to quantify, example bullets and recommended templates.
3. **Draft the resume JSON** (shape below). Write 3–5 bullets per recent role, each starting with an action verb and ending with a result. Mirror keywords from the job posting if the user shared one.
4. **Choose a template.** Prefer an ATS-friendly one (`classic`, `modern`, `ivy`, `ledger`, `vanguard`, `timeline`, `executive`, `compact`, …) for online applications. `GET /api/agent/templates?ats_only=true` lists them.
5. **Check the fit.** `POST /api/agent/preview` returns page 1 as PNG; the `x-resume-pages` header gives the page count. If it is over one page and the user wants one, shorten bullets, set `"scale": 0.9`, or switch to `compact`.
6. **Deliver.** `POST /api/agent/pdf` for the PDF file, and `POST /api/agent/link` for a link that opens the editor with the resume loaded so the user can tweak it. Give the user both.

## HTTP API

Base URL: `https://genedai.cv`. JSON in, JSON/PDF/PNG out. CORS is open. Rendering (pdf, preview) is limited to 6 requests per minute per IP. Full spec: `https://genedai.cv/openapi.json`.

| Method and path | Body / query | Returns |
|---|---|---|
| `GET /api/agent/templates` | `?ats_only=true` | `{ templates: [{ id, name, description, bestFor, atsFriendly, preview }] }` |
| `GET /api/agent/guide` | `?job_title=Data Analyst` | Writing guide JSON |
| `POST /api/agent/link` | `{ resume, template?, accent?, font?, scale? }` | `{ url, template, warnings }` |
| `POST /api/agent/preview` | same | `image/png` of page 1; headers `x-resume-pages`, `x-resume-warnings` |
| `POST /api/agent/pdf` | same | `application/pdf` (A4, selectable text) |

`template` is an id from the templates list (default `modern`). `accent` is `#RRGGBB`. `font` is one of `template, inter, source-sans, lato, roboto, source-serif, charis, garamond, tinos, plex-serif`. `scale` is 0.85–1.15.

```bash
curl -s https://genedai.cv/api/agent/pdf \
  -H 'content-type: application/json' \
  -d @request.json -o resume.pdf -D - | grep -i x-resume
```

## Resume JSON

A JSON Resume document (https://jsonresume.org/schema) also works. The native shape:

```json
{
  "fullName": "Alex Sterling",
  "title": "Senior Product Designer",
  "email": "alex@example.com",
  "phone": "+1 555 012 3456",
  "location": "San Francisco, CA",
  "website": "alexsterling.design",
  "linkedin": "linkedin.com/in/alexsterling",
  "summary": "Product designer with 6 years of experience ...",
  "experience": [
    {
      "company": "TechNova",
      "role": "Senior Product Designer",
      "startDate": "2021-03",
      "endDate": "",
      "isCurrent": true,
      "description": "- Led the design system, cutting UI build time by 30%\n- Shipped 4 major releases"
    }
  ],
  "education": [{ "school": "California College of the Arts", "degree": "BFA in Interaction Design", "startDate": "2014-09", "endDate": "2018-05" }],
  "projects": [{ "name": "EcoTrack", "link": "github.com/alex/ecotrack", "description": "Carbon tracking app; 12k downloads." }],
  "skills": ["Design: Figma, Prototyping", "User research"]
}
```

- Dates are `YYYY-MM`. For a current role set `"isCurrent": true` and `"endDate": ""`.
- `description` holds one bullet per line, each starting with `- `.
- Skills may be grouped as `"Category: item, item"`; templates render the groups.

## Privacy

Resumes sent to `/api/agent/pdf` or `/preview` are rendered and discarded, never stored. Editor links carry the resume in the URL fragment (`#resume=…`), which browsers don't send to servers; the user's edits are saved only in their browser.
