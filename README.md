<div align="center">

# ModernCV - AI Resume Builder

<img width="100" height="100" src="https://img.icons8.com/fluency/100/resume.png" alt="ModernCV Logo"/>

**A modern, AI-powered resume builder with real-time preview and Gemini AI text enhancement**

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![React](https://img.shields.io/badge/React-19.x-61DAFB?logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?logo=typescript)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-6.x-646CFF?logo=vite)](https://vitejs.dev/)
[![Gemini AI](https://img.shields.io/badge/Gemini-AI-4285F4?logo=google)](https://ai.google.dev/)

[English](#features) | [中文](#功能特性)

</div>

---

## Features

- **Real-time Preview** - See your resume update instantly as you type
- **AI-Powered Enhancement** - Use Google Gemini AI to improve and polish your resume text
- **Auto-Generate Summary** - Generate professional summaries based on your role and skills
- **Print-Ready Export** - Export your resume as a high-quality PDF with `Cmd/Ctrl + P`
- **Responsive Design** - Works seamlessly on desktop and mobile devices
- **Modern UI** - Clean, professional interface built with Tailwind CSS
- **No Backend Required** - Runs entirely in the browser (except AI features)

## 功能特性

- **实时预览** - 输入内容时即时查看简历更新
- **AI 智能优化** - 使用 Google Gemini AI 优化和润色简历文本
- **自动生成摘要** - 根据职位和技能自动生成专业摘要
- **打印导出** - 使用 `Cmd/Ctrl + P` 导出高质量 PDF
- **响应式设计** - 完美适配桌面端和移动端
- **现代化界面** - 使用 Tailwind CSS 构建的简洁专业界面
- **无需后端** - 除 AI 功能外完全在浏览器中运行

---

## Tech Stack / 技术栈

| Technology | Description |
|------------|-------------|
| [React 19](https://react.dev/) | UI Framework |
| [TypeScript](https://www.typescriptlang.org/) | Type-safe JavaScript |
| [Vite](https://vitejs.dev/) | Next-generation build tool |
| [Tailwind CSS](https://tailwindcss.com/) | Utility-first CSS framework |
| [Google Gemini AI](https://ai.google.dev/) | AI text enhancement |

---

## Quick Start / 快速开始

### Prerequisites / 前提条件

- [Node.js](https://nodejs.org/) (v18 or higher recommended)
- [Google Gemini API Key](https://ai.google.dev/)

### Installation / 安装

```bash
# Clone the repository / 克隆仓库
git clone https://github.com/your-username/modern-ai-resume-builder.git

# Navigate to the project directory / 进入项目目录
cd modern-ai-resume-builder

# Install dependencies / 安装依赖
npm install
```

### Configuration / 配置

1. Create a `.env.local` file in the project root (or edit the existing one):

```bash
# .env.local
GEMINI_API_KEY=your_gemini_api_key_here
```

2. Get your Gemini API key from [Google AI Studio](https://ai.google.dev/)

### Running the App / 运行应用

```bash
# Development mode / 开发模式
npm run dev

# Build for production / 构建生产版本
npm run build

# Preview production build / 预览生产版本
npm run preview
```

The app will be available at `http://localhost:5173`

---

## Project Structure / 项目结构

```
modern-ai-resume-builder/
├── components/
│   ├── Icons.tsx          # SVG icon components
│   ├── ResumeEditor.tsx   # Main editor with tabs (Basics, Experience, Skills)
│   └── ResumePreview.tsx  # Real-time resume preview component
├── services/
│   └── geminiService.ts   # Google Gemini AI integration
├── App.tsx                # Main application component
├── index.tsx              # Application entry point
├── types.ts               # TypeScript type definitions
├── index.html             # HTML template
├── index.css              # Global styles with Tailwind
├── vite.config.ts         # Vite configuration
├── tsconfig.json          # TypeScript configuration
└── package.json           # Project dependencies
```

---

## Usage Guide / 使用指南

### Editing Your Resume / 编辑简历

1. Click **"Edit Resume"** to enter edit mode
2. Use the **tabs** to navigate between sections:
   - **Basics**: Personal details, summary, and education
   - **Experience**: Work history with AI-enhanced descriptions
   - **Skills**: Skills list and project showcase

### AI Features / AI 功能

- **Polish Text**: Click the ✨ sparkle icon on any text field to improve it with AI
- **Generate Summary**: Click "Generate with AI" to create a professional summary based on your role and skills

### Exporting / 导出

- Click **"Download PDF"** or press `Cmd/Ctrl + P` to open the print dialog
- Select "Save as PDF" to export your resume

---

## Resume Sections / 简历模块

| Section | Description |
|---------|-------------|
| **Personal Info** | Name, title, contact details, website, LinkedIn |
| **Summary** | Professional summary (AI-generated or custom) |
| **Experience** | Work history with company, role, dates, and descriptions |
| **Education** | Schools, degrees, and graduation dates |
| **Skills** | Comma-separated list of skills |
| **Projects** | Personal or professional projects with links |

---

## API Reference / API 参考

### Gemini Service

```typescript
// Improve existing text with AI
improveText(text: string, context: string): Promise<string>

// Generate professional summary
generateSummary(role: string, skills: string[]): Promise<string>
```

---

## Contributing / 贡献指南

We welcome contributions! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines

- Follow the existing code style
- Write TypeScript types for new features
- Test on both desktop and mobile viewports
- Ensure AI features gracefully degrade when API is unavailable

---

## Roadmap / 路线图

- [ ] Multiple resume templates
- [ ] Dark mode support
- [ ] Local storage persistence
- [ ] Import from LinkedIn
- [ ] Export to DOCX format
- [ ] Multi-language support
- [ ] Cover letter generator

---

## License / 许可证

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

```
MIT License

Copyright (c) 2024 Modern AI Resume Builder

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

---

## Acknowledgments / 致谢

- [Google Gemini AI](https://ai.google.dev/) for powering the text enhancement features
- [Tailwind CSS](https://tailwindcss.com/) for the beautiful styling utilities
- [Vite](https://vitejs.dev/) for the lightning-fast development experience
- [React](https://react.dev/) for the robust UI framework

---

<div align="center">

**If you find this project helpful, please consider giving it a ⭐**

Made with ❤️ by the Open Source Community

</div>
