import React, { useState } from 'react';
import { Link } from 'react-router';
import { useSeo, SEO_ROBOTS_INDEX, getSiteUrl } from '../hooks/useSeo';
import { SiteHeader, SiteFooter } from '../components/SiteHeader';
import { AgentPromptCard } from '../components/AgentPromptCard';
import { CheckIcon, FileIcon } from '../components/Icons';
import { buildAgentPrompt, mcpSetup, MCP_TOOLS } from '../shared/agentPrompt.mjs';
import { TEMPLATES } from '../constants/templates';

const CodeBlock: React.FC<{ code: string; label: string }> = ({ code, label }) => {
  const [copied, setCopied] = useState(false);
  return (
    <div className="relative">
      <pre className="overflow-x-auto rounded-lg bg-slate-900 p-4 pr-20 font-mono text-[13px] leading-relaxed text-slate-100">{code}</pre>
      <button
        type="button"
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(code);
            setCopied(true);
            window.setTimeout(() => setCopied(false), 2000);
          } catch {
            setCopied(false);
          }
        }}
        aria-label={`Copy ${label}`}
        className="absolute right-2 top-2 inline-flex items-center gap-1 rounded-md bg-white/10 px-2 py-1 text-xs font-medium text-white hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
      >
        {copied ? <CheckIcon className="h-3.5 w-3.5" /> : <FileIcon className="h-3.5 w-3.5" />}
        {copied ? 'Copied' : 'Copy'}
      </button>
    </div>
  );
};

const H2: React.FC<{ id: string; children: React.ReactNode }> = ({ id, children }) => (
  <h2 id={id} className="scroll-mt-24 text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
    {children}
  </h2>
);

const AgentsView: React.FC = () => {
  const siteUrl = getSiteUrl();
  const pageUrl = `${siteUrl}/agents/`;
  const title = 'Use ModernCV from AI Agents (MCP Server, Skill, API) | ModernCV';
  const description = `Connect Claude, ChatGPT, Cursor or any AI agent to ModernCV: a free remote MCP server, an agent skill and an HTTP API to draft resumes, render ${TEMPLATES.length} templates to PDF and hand off an editor link.`;

  useSeo({
    title,
    description,
    keywords: 'resume mcp server, ai agent resume builder, claude resume skill, resume pdf api, chatgpt resume builder, mcp resume',
    canonical: '/agents/',
    robots: SEO_ROBOTS_INDEX,
    ldJson: {
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'TechArticle',
          '@id': `${pageUrl}#article`,
          headline: 'Use ModernCV from AI agents',
          description,
          url: pageUrl,
          inLanguage: 'en',
          about: ['Model Context Protocol', 'Resume', 'AI agents'],
        },
        {
          '@type': 'WebAPI',
          '@id': `${siteUrl}/#agent-api`,
          name: 'ModernCV Agent API',
          description: 'Writing guides, example resumes, PNG previews, vector PDFs and editor links for AI agents.',
          documentation: `${siteUrl}/openapi.json`,
          url: `${siteUrl}/mcp`,
          provider: { '@type': 'Organization', name: 'ModernCV', url: `${siteUrl}/` },
          isAccessibleForFree: true,
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'Home', item: `${siteUrl}/` },
            { '@type': 'ListItem', position: 2, name: 'AI agents', item: pageUrl },
          ],
        },
      ],
    },
  });

  const skillUrl = `${siteUrl}/skills/moderncv-resume/SKILL.md`;
  const curlPdf = `curl -s ${siteUrl}/api/agent/pdf \\
  -H 'content-type: application/json' \\
  -d '{"template":"classic","resume":{"fullName":"Pat Lee","title":"Data Analyst","email":"pat@example.com","experience":[{"company":"Northwind","role":"Data Analyst","startDate":"2022-01","isCurrent":true,"description":"- Built dashboards used by 40 managers"}],"skills":["Tools: SQL, Tableau"]}}' \\
  -o resume.pdf`;

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 font-sans dark:bg-slate-950">
      <SiteHeader />
      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-10 sm:px-6">
        <nav aria-label="Breadcrumb" className="text-sm text-slate-500 dark:text-slate-400">
          <Link className="hover:text-slate-900 dark:hover:text-white" to="/">
            Home
          </Link>
          <span className="mx-2" aria-hidden="true">
            /
          </span>
          <span className="text-slate-700 dark:text-slate-200" aria-current="page">
            AI agents
          </span>
        </nav>
        <h1 className="mt-4 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl dark:text-white">Use ModernCV from any AI agent</h1>
        <p className="mt-3 max-w-3xl text-lg leading-relaxed text-slate-600 dark:text-slate-400">
          Let Claude, ChatGPT, Cursor or your own agent draft a resume, render it in any of our {TEMPLATES.length} templates, and hand you a vector PDF and an
          editor link. Free, no account, no API key.
        </p>
        <ul className="mt-4 flex flex-wrap gap-x-5 gap-y-1 text-sm font-medium text-indigo-700 dark:text-indigo-300">
          <li><a href="#mcp" className="hover:underline">MCP server</a></li>
          <li><a href="#skill" className="hover:underline">Agent skill</a></li>
          <li><a href="#api" className="hover:underline">HTTP API</a></li>
          <li><a href="#files" className="hover:underline">Machine-readable files</a></li>
        </ul>

        <AgentPromptCard className="mt-8" subject="your resume" prompt={buildAgentPrompt({ siteUrl })} />
        <p className="mt-3 text-sm text-slate-600 dark:text-slate-400">
          Want a specific design? Every <Link to="/templates/" className="font-medium text-indigo-700 hover:underline dark:text-indigo-300">template page</Link> and{' '}
          <Link to="/directory/" className="font-medium text-indigo-700 hover:underline dark:text-indigo-300">job page</Link> has its own ready-made prompt.
        </p>

        <section className="mt-14 space-y-5" aria-labelledby="mcp">
          <H2 id="mcp">Connect the MCP server</H2>
          <p className="text-slate-600 dark:text-slate-400">
            A remote <a href="https://modelcontextprotocol.io" className="text-indigo-700 hover:underline dark:text-indigo-300">Model Context Protocol</a> server at{' '}
            <code className="rounded bg-slate-200/70 px-1.5 py-0.5 text-sm dark:bg-slate-800">{siteUrl}/mcp</code> (Streamable HTTP, no auth).
          </p>
          <div className="space-y-4">
            {mcpSetup(siteUrl).map((s) => (
              <div key={s.client}>
                <h3 className="mb-1.5 text-sm font-semibold text-slate-900 dark:text-white">{s.client}</h3>
                <CodeBlock code={s.code} label={`${s.client} setup`} />
              </div>
            ))}
          </div>
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
            <table className="w-full text-left text-sm">
              <caption className="sr-only">MCP tools</caption>
              <thead className="bg-slate-50 text-slate-900 dark:bg-slate-800/60 dark:text-white">
                <tr>
                  <th scope="col" className="px-4 py-2 font-semibold">Tool</th>
                  <th scope="col" className="px-4 py-2 font-semibold">What it does</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {MCP_TOOLS.map(([name, text]) => (
                  <tr key={name}>
                    <td className="whitespace-nowrap px-4 py-2 font-mono text-[13px] text-slate-900 dark:text-slate-100">{name}</td>
                    <td className="px-4 py-2 text-slate-600 dark:text-slate-400">{text}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="mt-14 space-y-4" aria-labelledby="skill">
          <H2 id="skill">Install the agent skill</H2>
          <p className="text-slate-600 dark:text-slate-400">
            For agents that support <code className="rounded bg-slate-200/70 px-1.5 py-0.5 text-sm dark:bg-slate-800">SKILL.md</code> skills (Claude Code, Claude, Amp and others). It teaches the
            workflow and calls the HTTP API, so it works even without MCP. <a href={skillUrl} className="font-medium text-indigo-700 hover:underline dark:text-indigo-300">View SKILL.md</a>
          </p>
          <CodeBlock
            label="skill install command"
            code={`mkdir -p ~/.claude/skills/moderncv-resume && \\\n  curl -fsSL ${skillUrl} -o ~/.claude/skills/moderncv-resume/SKILL.md`}
          />
        </section>

        <section className="mt-14 space-y-4" aria-labelledby="api">
          <H2 id="api">HTTP API</H2>
          <p className="text-slate-600 dark:text-slate-400">
            The same tools as REST endpoints, described in <a href={`${siteUrl}/openapi.json`} className="font-medium text-indigo-700 hover:underline dark:text-indigo-300">openapi.json</a> (usable
            as GPT Actions). CORS is open. Rendering is limited to 6 requests per minute per IP.
          </p>
          <ul className="space-y-1 font-mono text-[13px] text-slate-700 dark:text-slate-300">
            <li>GET  /api/agent/templates?ats_only=true</li>
            <li>GET  /api/agent/guide?job_title=…</li>
            <li>GET  /api/agent/example?job_title=…</li>
            <li>POST /api/agent/preview → image/png</li>
            <li>POST /api/agent/pdf → application/pdf</li>
            <li>POST /api/agent/link → {'{ url }'}</li>
          </ul>
          <CodeBlock label="curl example" code={curlPdf} />
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Editor handoff: <code className="rounded bg-slate-200/70 px-1.5 py-0.5 dark:bg-slate-800">{siteUrl}/editor/#resume=…</code> opens the editor with a resume loaded. The resume stays in
            the URL fragment, which browsers never send to the server.
          </p>
        </section>

        <section className="mt-14 space-y-3" aria-labelledby="files">
          <H2 id="files">Machine-readable files</H2>
          <ul className="list-disc space-y-1.5 pl-5 text-slate-600 dark:text-slate-400">
            <li><a className="font-medium text-indigo-700 hover:underline dark:text-indigo-300" href={`${siteUrl}/llms.txt`}>llms.txt</a> and <a className="font-medium text-indigo-700 hover:underline dark:text-indigo-300" href={`${siteUrl}/llms-full.txt`}>llms-full.txt</a>: site overview, templates, guides and FAQs for LLMs.</li>
            <li><a className="font-medium text-indigo-700 hover:underline dark:text-indigo-300" href={`${siteUrl}/templates.json`}>templates.json</a>: the template catalog.</li>
            <li><a className="font-medium text-indigo-700 hover:underline dark:text-indigo-300" href={`${siteUrl}/resume.schema.json`}>resume.schema.json</a>: the resume JSON Schema (JSON Resume documents are accepted too).</li>
            <li><code className="text-sm">/examples/&lt;job-slug&gt;.json</code>: the example resume of every job page, e.g. <a className="font-medium text-indigo-700 hover:underline dark:text-indigo-300" href={`${siteUrl}/examples/software-engineer.json`}>software-engineer.json</a>.</li>
          </ul>
        </section>

        <section className="mt-14 rounded-2xl border border-slate-200 bg-white p-6 text-sm leading-relaxed text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">
          <h2 className="text-base font-semibold text-slate-900 dark:text-white">Privacy</h2>
          <p className="mt-2">
            Resumes sent for rendering are processed in memory and discarded; nothing is stored or logged. Editor links keep the resume in the URL fragment. In the editor, data lives only in the
            user's browser.
          </p>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
};

export default AgentsView;
