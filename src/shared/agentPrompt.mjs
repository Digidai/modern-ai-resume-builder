// Copy-paste prompts that let any AI agent build a resume with ModernCV's templates (MCP server or
// HTTP API). Shared by the template, job and /agents pages and by scripts/seo-postbuild.mjs.

/**
 * @param {{ siteUrl: string, template?: { id: string, name: string, description: string } | null, jobTitle?: string }} input
 */
export const buildAgentPrompt = ({ siteUrl, template = null, jobTitle = '' }) => {
  const target = jobTitle ? `a ${jobTitle} resume` : 'my resume';
  const design = template ? ` using the ModernCV "${template.name}" template (id "${template.id}": ${template.description.charAt(0).toLowerCase()}${template.description.slice(1)})` : ' with a ModernCV template';
  return `Help me create ${target}${design}.

Use the ModernCV MCP server at ${siteUrl}/mcp if it is connected. If not, use the ModernCV HTTP API described in ${siteUrl}/skills/moderncv-resume/SKILL.md (no API key needed).

1. Ask me for my target role and my real experience: employers, titles, dates, achievements with numbers, education, skills and links (GitHub, portfolio…). Never invent facts or metrics.
2. Read the writing guide and the example resume for ${jobTitle ? `"${jobTitle}"` : 'my target role'} (get_writing_guide, get_example_resume) and follow their structure.
3. Draft my resume as ModernCV JSON. Write 3–5 achievement bullets for recent roles, each starting with a verb and ending with a result.
4. ${template ? `Render a preview with template "${template.id}"` : 'Suggest 2–3 templates (list_templates; prefer ATS-friendly ones for online applications), then render a preview with my choice'} and check the page count. Tighten it to one page unless I have 10+ years of experience.
5. Give me the PDF (render_pdf) and an editor link (create_editor_link) so I can review and edit it at ${siteUrl}.`;
};

/** MCP client setup snippets for the /agents page. */
export const mcpSetup = (siteUrl) => [
  { client: 'Claude Code', language: 'bash', code: `claude mcp add --transport http moderncv ${siteUrl}/mcp` },
  {
    client: 'Claude (web and desktop)',
    language: 'text',
    code: `Settings → Connectors → Add custom connector\nName: ModernCV\nURL: ${siteUrl}/mcp`,
  },
  { client: 'Cursor (~/.cursor/mcp.json)', language: 'json', code: JSON.stringify({ mcpServers: { moderncv: { url: `${siteUrl}/mcp` } } }, null, 2) },
  { client: 'VS Code (.vscode/mcp.json)', language: 'json', code: JSON.stringify({ servers: { moderncv: { type: 'http', url: `${siteUrl}/mcp` } } }, null, 2) },
  { client: 'Any MCP client', language: 'text', code: `Transport: Streamable HTTP\nURL: ${siteUrl}/mcp\nAuth: none` },
];

/** The MCP tools, for documentation pages. */
export const MCP_TOOLS = [
  ['list_templates', 'All templates with description, best-for roles, ATS status and preview image.'],
  ['get_writing_guide', 'Section order, length, skills, metrics, example bullets and FAQs for a job title.'],
  ['get_example_resume', 'A complete, realistic example resume for a job title, in render-ready JSON.'],
  ['get_resume_schema', 'JSON Schema of the resume object.'],
  ['import_publications', 'Publications from a public ORCID record or BibTeX, filterable by type and year, for academic CVs.'],
  ['export_latex', 'The resume as a standalone .tex file for Overleaf or a local TeX install.'],
  ['render_preview', 'Page 1 as a PNG plus the page count, to check layout and length.'],
  ['render_pdf', 'An A4 vector PDF with selectable text and embedded fonts.'],
  ['create_editor_link', 'A link that opens the editor with the resume loaded (kept in the URL fragment, never stored).'],
];
