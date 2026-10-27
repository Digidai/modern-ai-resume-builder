import React, { useState } from 'react';
import { Link } from 'react-router';
import { useSeo, SEO_ROBOTS_INDEX, getSiteUrl } from '../hooks/useSeo';
import { SiteHeader, SiteFooter } from '../components/SiteHeader';
import { AgentPromptCard } from '../components/AgentPromptCard';
import { buildAgentPrompt, mcpSetup, MCP_TOOLS } from '../shared/agentPrompt.mjs';
import { TEMPLATES } from '../constants/templates';

const CodeBlock: React.FC<{ code: string; label: string; title?: string }> = ({ code, label, title }) => {
  const [copied, setCopied] = useState(false);
  return (
    <div className="overflow-hidden rounded-xl border border-rule bg-surface shadow-card">
      <div className="flex items-center justify-between gap-3 border-b border-rule bg-tint px-4 py-2">
        <span className="kicker truncate text-muted">{title ?? label}</span>
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
          className="focus-ring h-7 shrink-0 rounded-md border border-rule bg-surface px-2.5 text-xs font-medium text-ink shadow-card transition-colors hover:bg-tint"
        >
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
      <pre className="overflow-x-auto p-4 font-label text-[13px] leading-relaxed text-ink">{code}</pre>
    </div>
  );
};

const H2: React.FC<{ id: string; children: React.ReactNode }> = ({ id, children }) => (
  <h2 id={id} className="scroll-mt-24 font-display text-[32px] font-semibold leading-[38px] tracking-display text-ink">
    {children}
  </h2>
);

const link = 'focus-ring font-medium text-accent underline decoration-accent/30 underline-offset-4 hover:decoration-accent';
const code = 'rounded-lg bg-tint px-1.5 py-0.5 font-label text-[0.85em] text-ink';

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
    <div className="flex min-h-screen flex-col bg-paper font-sans text-ink">
      <SiteHeader />
      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-10 sm:px-6">
        <nav aria-label="Breadcrumb" className="text-sm text-muted">
          <Link className="focus-ring hover:text-ink" to="/">
            Home
          </Link>
          <span className="mx-2" aria-hidden="true">
            /
          </span>
          <span className="text-ink" aria-current="page">
            AI agents
          </span>
        </nav>
        <p className="kicker mt-6 text-muted">MCP server · Agent skill · HTTP API</p>
        <h1 className="mt-2 font-display text-[40px] font-semibold leading-[44px] tracking-display text-ink lg:text-[56px] lg:leading-[60px]">Use ModernCV from any AI agent</h1>
        <p className="mt-4 max-w-3xl text-[17px] leading-[28px] text-muted">
          Let Claude, ChatGPT, Cursor or your own agent draft a resume, render it in any of our {TEMPLATES.length} templates, and hand you a vector PDF and an
          editor link. Free, no account, no API key.
        </p>
        <ul className="mt-5 flex flex-wrap gap-x-6 gap-y-1 text-sm">
          <li><a href="#mcp" className={link}>MCP server</a></li>
          <li><a href="#skill" className={link}>Agent skill</a></li>
          <li><a href="#api" className={link}>HTTP API</a></li>
          <li><a href="#files" className={link}>Machine-readable files</a></li>
        </ul>

        <AgentPromptCard className="mt-10" subject="your resume" prompt={buildAgentPrompt({ siteUrl })} defaultOpen />
        <p className="mt-3 text-sm text-muted">
          Want a specific design? Every <Link to="/templates/" className={link}>template page</Link> and{' '}
          <Link to="/directory/" className={link}>job page</Link> has its own ready-made prompt.
        </p>

        <section className="mt-16 space-y-5" aria-labelledby="mcp">
          <H2 id="mcp">Connect the MCP server</H2>
          <p className="text-base leading-[26px] text-muted">
            A remote <a href="https://modelcontextprotocol.io" className={link}>Model Context Protocol</a> server at{' '}
            <code className={code}>{siteUrl}/mcp</code> (Streamable HTTP, no auth).
          </p>
          <div className="space-y-4">
            {/* "Any MCP client" repeats the URL, transport and auth stated in the paragraph above. */}
            {mcpSetup(siteUrl).filter((s) => s.client !== 'Any MCP client').map((s) => (
              <CodeBlock key={s.client} code={s.code} label={`${s.client} setup`} title={s.client} />
            ))}
          </div>
          <div className="overflow-hidden rounded-xl border border-rule bg-surface shadow-card">
          <table className="w-full text-left text-sm">
            <caption className="sr-only">MCP tools</caption>
            <thead>
              <tr className="border-b border-rule bg-tint">
                <th scope="col" className="kicker px-4 py-2.5 text-muted">Tool</th>
                <th scope="col" className="kicker px-4 py-2.5 text-muted">What it does</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-rule">
              {MCP_TOOLS.map(([name, text]) => (
                <tr key={name}>
                  <td className="px-4 py-3 align-top font-label text-[13px] text-ink sm:whitespace-nowrap">{name}</td>
                  <td className="px-4 py-3 leading-6 text-muted">{text}</td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </section>

        <section className="mt-16 space-y-4" aria-labelledby="skill">
          <H2 id="skill">Install the agent skill</H2>
          <p className="text-base leading-[26px] text-muted">
            For agents that support <code className={code}>SKILL.md</code> skills (Claude Code, Claude, Amp and others). It teaches the workflow and calls the
            HTTP API, so it works even without MCP. <a href={skillUrl} className={link}>View SKILL.md</a>
          </p>
          <CodeBlock
            label="skill install command"
            title="Shell"
            code={`mkdir -p ~/.claude/skills/moderncv-resume && \\\n  curl -fsSL ${skillUrl} -o ~/.claude/skills/moderncv-resume/SKILL.md`}
          />
        </section>

        <section className="mt-16 space-y-4" aria-labelledby="api">
          <H2 id="api">HTTP API</H2>
          <p className="text-base leading-[26px] text-muted">
            The same tools as REST endpoints, described in <a href={`${siteUrl}/openapi.json`} className={link}>openapi.json</a> (usable as GPT Actions). CORS is
            open. Rendering is limited to 6 requests per minute per IP.
          </p>
          <ul className="divide-y divide-rule border-y border-rule font-label text-[13px] text-ink">
            <li className="py-1.5">GET  /api/agent/templates?ats_only=true</li>
            <li className="py-1.5">GET  /api/agent/guide?job_title=…</li>
            <li className="py-1.5">GET  /api/agent/example?job_title=…</li>
            <li className="py-1.5">POST /api/agent/preview → image/png</li>
            <li className="py-1.5">POST /api/agent/pdf → application/pdf</li>
            <li className="py-1.5">POST /api/agent/link → {'{ url }'}</li>
          </ul>
          <CodeBlock label="curl example" title="curl" code={curlPdf} />
          <p className="text-sm leading-6 text-muted">
            Editor handoff: <code className={`${code} break-all`}>{siteUrl}/editor/#resume=…</code> opens the editor with a resume loaded. The resume stays in the URL
            fragment, which browsers never send to the server.
          </p>
        </section>

        <section className="mt-16 space-y-3" aria-labelledby="files">
          <H2 id="files">Machine-readable files</H2>
          <ul className="divide-y divide-rule border-y border-rule text-[15px] leading-6 text-muted">
            <li className="py-2.5"><a className={link} href={`${siteUrl}/llms.txt`}>llms.txt</a> and <a className={link} href={`${siteUrl}/llms-full.txt`}>llms-full.txt</a>: site overview, templates, guides and FAQs for LLMs.</li>
            <li className="py-2.5"><a className={link} href={`${siteUrl}/templates.json`}>templates.json</a>: the template catalog.</li>
            <li className="py-2.5"><a className={link} href={`${siteUrl}/resume.schema.json`}>resume.schema.json</a>: the resume JSON Schema (JSON Resume documents are accepted too).</li>
            <li className="py-2.5"><code className={code}>/examples/&lt;job-slug&gt;.json</code>: the example resume of every job page, e.g. <a className={link} href={`${siteUrl}/examples/software-engineer.json`}>software-engineer.json</a>.</li>
          </ul>
        </section>

        <section className="mt-16 border-t border-rule pt-6 text-[15px] leading-6 text-muted">
          <h2 className="font-display text-xl font-semibold tracking-display text-ink">Privacy</h2>
          <p className="mt-2 max-w-3xl">
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
