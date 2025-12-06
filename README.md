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
- A Gemini API key from [Google AI Studio](https://aistudio.google.com/)

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

3. Set your Gemini API key in `.env.local`:
   ```
   API_KEY=your_gemini_api_key_here
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

5. Open http://localhost:5173 in your browser

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build |

## Project Structure

```
modern-ai-resume-builder/
├── components/
│   ├── Icons.tsx           # SVG icon components
│   ├── ResumeEditor.tsx    # Main editor with tabs
│   ├── ResumePreview.tsx   # Resume display component
│   └── ResumeTemplates.tsx # Template definitions
├── services/
│   └── geminiService.ts    # Gemini AI integration
├── App.tsx                 # Main application component
├── types.ts                # TypeScript type definitions
├── index.tsx               # Entry point
└── index.html              # HTML template
```

## License

MIT
