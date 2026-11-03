#!/usr/bin/env node
// Smoke test for the agent API and MCP server against a live deployment (Browser Rendering included).
//
//   npm run smoke:agent                          # https://genedai.cv
//   npm run smoke:agent -- http://localhost:8787 # a `wrangler dev` with RENDER_ORIGIN set to a public origin
//
// Checks that PDFs render with the page count reported in x-resume-pages, that an over-long resume
// gets a "scale" hint that really fits (one page, or two for Federal), and that MCP render_pdf returns
// a download link that downloads the same PDF and rejects a tampered link. It uses exactly 6 renders;
// on a 429 it waits for retry-after and tries once more.

const BASE = (process.argv[2] || process.env.SMOKE_BASE_URL || 'https://genedai.cv').replace(/\/$/, '');

let failures = 0;
const check = (ok, label, detail = '') => {
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${label}${detail ? ` (${detail})` : ''}`);
  if (!ok) failures += 1;
  return ok;
};

// 429: wait out the per-IP render limit. 503: Browser Rendering occasionally fails one launch when
// several start within seconds; one retry tells that apart from an outage (and is logged).
const fetchWithRetry = async (url, init) => {
  const response = await fetch(url, init);
  if (response.status !== 429 && response.status !== 503) return response;
  const wait = response.status === 503 ? 10 : Number(response.headers.get('retry-after') || 60);
  console.log(`     ${response.status === 503 ? `503 (${(await response.text()).slice(0, 120)}), retrying` : 'rate limited'} in ${wait}s`);
  await new Promise((resolve) => setTimeout(resolve, wait * 1000));
  return fetch(url, init);
};

/** Page count of a Chromium PDF (its page tree's /Count). */
const pdfPages = (bytes) => {
  const text = Buffer.from(bytes).toString('latin1');
  if (!text.startsWith('%PDF-')) return 0;
  return Math.max(0, ...Array.from(text.matchAll(/\/Count (\d+)/g), (m) => Number(m[1])));
};

const scaleIn = (warnings) => {
  const match = /"scale": ([\d.]+)/.exec(warnings.join(' '));
  return match ? Number(match[1]) : null;
};

/** POST /api/agent/pdf; returns pages from the header and from the file, plus decoded warnings. */
const renderPdf = async (body) => {
  const response = await fetchWithRetry(`${BASE}/api/agent/pdf`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
  const bytes = new Uint8Array(await response.arrayBuffer());
  return {
    status: response.status,
    pages: Number(response.headers.get('x-resume-pages')),
    pdfPages: pdfPages(bytes),
    warnings: JSON.parse(decodeURIComponent(response.headers.get('x-resume-warnings') || '%5B%5D')),
  };
};

let rpcId = 0;
const mcp = async (method, params) => {
  const response = await fetchWithRetry(`${BASE}/mcp`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', accept: 'application/json, text/event-stream', 'mcp-protocol-version': '2025-06-18' },
    body: JSON.stringify({ jsonrpc: '2.0', id: ++rpcId, method, params }),
  });
  return { status: response.status, body: await response.json() };
};

// --- Fixtures ----------------------------------------------------------------------------------

const bullets = (count, label) =>
  Array.from({ length: count }, (_, i) => `- ${label} ${i + 1}: improved onboarding conversion and partnered with engineering to ship on schedule`).join('\n');

const designer = {
  fullName: 'Alex Sterling',
  title: 'Senior Product Designer',
  email: 'alex@example.com',
  phone: '+1 555 012 3456',
  location: 'San Francisco, CA',
  website: 'alexsterling.design',
  summary: 'Product designer with 6 years of experience building design systems and data-heavy SaaS products.',
  experience: [
    { role: 'Senior Product Designer', company: 'TechNova Solutions', startDate: 'Mar 2021', endDate: 'Present', description: '- Led the company-wide design system, cutting UI development time by 30%\n- Shipped 4 major SaaS releases with product and engineering partners' },
    { role: 'UI/UX Designer', company: 'Creative Pulse Agency', startDate: 'Jun 2018', endDate: 'Feb 2021', description: '- Designed web and mobile apps for fintech and healthcare clients' },
  ],
  education: [{ degree: 'BFA in Interaction Design', school: 'California College of the Arts', startDate: '2014', endDate: '2018' }],
  skills: ['Figma', 'Design Systems', 'Prototyping', 'User Research'],
};

// About 1.1 pages in "classic": fits one page at a slightly smaller scale.
const junior = (n) => ({ role: 'Junior Designer', company: `Pixel Studio ${n}`, startDate: 'Jan 2017', endDate: 'May 2018', description: '- Built marketing pages and email templates for retail clients\n- Ran usability sessions with 20 participants' });
const longDesigner = {
  ...designer,
  experience: [
    { ...designer.experience[0], description: bullets(6, 'Initiative') },
    { role: 'Product Designer', company: 'Brightline Health', startDate: 'Jan 2020', endDate: 'Feb 2021', description: bullets(5, 'Project') },
    { ...designer.experience[1], startDate: 'Jun 2018', endDate: 'Dec 2019', description: bullets(5, 'Client') },
    junior(1),
    junior(2),
  ],
  projects: [{ name: 'EcoTrack', link: 'github.com/alex/ecotrack', description: 'Mobile app that helps people track their carbon footprint with weekly challenges; 12k downloads.' }],
};

// About 2.5 pages on US Letter in "federal": fits two pages at a smaller scale.
const federal = {
  fullName: 'Jordan Rivera',
  title: 'Program Analyst',
  email: 'jordan@example.com',
  phone: '+1 202 555 0147',
  location: 'Arlington, VA',
  summary: 'Program analyst with 10 years of federal experience in budget formulation, performance measurement and acquisition support.',
  experience: Array.from({ length: 5 }, (_, i) => ({
    role: `Program Analyst, GS-0343-${12 - (i % 3)}`,
    company: `U.S. Department of Agency ${i + 1}, Washington, DC`,
    startDate: `0${1 + (i % 8)}/20${20 - i}`,
    endDate: i === 0 ? 'Present' : `0${1 + (i % 8)}/20${21 - i}`,
    hours: '40',
    description: Array.from({ length: 5 }, (_, k) => `- Analyzed program performance data for initiative ${k + 1}, briefed senior leadership and recommended budget changes adopted in the next fiscal year`).join('\n'),
  })),
  education: [{ degree: 'MPA, Public Administration', school: 'George Mason University', startDate: '08/2010', endDate: '05/2012' }],
  skills: ['Security Clearance: Secret, active', 'Certifications: PMP, PMI, 2019; FAC-P/PM Level II, 2021', 'Budget formulation', 'Data analysis', 'Excel, Tableau'],
  awards: [{ title: "Secretary's Honor Award", issuer: 'Department of Agency', year: '2023' }],
};

// --- Checks ------------------------------------------------------------------------------------

console.log(`Agent smoke test against ${BASE}\n`);

const first = await fetch(`${BASE}/api/agent/templates`);
if (first.headers.get('cf-mitigated') === 'challenge' || !first.headers.get('content-type')?.includes('json')) {
  // Bot Fight Mode (or a WAF rule) answered instead of the Worker; every other request would fail the same way.
  console.log(`FAIL GET /api/agent/templates returned ${first.status} ${first.headers.get('cf-mitigated') === 'challenge' ? 'a Cloudflare bot challenge' : first.headers.get('content-type')}, not the API`);
  process.exit(1);
}
const templates = await first.json();
check(Array.isArray(templates.templates) && templates.templates.some((t) => t.id === 'federal' && t.maxPages === 2), 'GET /api/agent/templates lists federal with maxPages 2', `${templates.templates?.length} templates`);

// Input handling (no renders): template names resolve, unknown ids are rejected, dates are normalized.
const postLink = async (body) => {
  const response = await fetch(`${BASE}/api/agent/link`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });
  return { status: response.status, body: await response.json() };
};
const byName = await postLink({ template: 'Ledger', resume: designer });
check(byName.status === 200 && byName.body.template === 'banking', 'template display name "Ledger" resolves to banking', `${byName.status} ${byName.body.template}`);
const unknown = await postLink({ template: 'nope', resume: designer });
check(unknown.status === 400 && unknown.body.error?.code === 'INVALID_TEMPLATE', 'unknown template is a 400 INVALID_TEMPLATE', `${unknown.status} ${unknown.body.error?.code}`);
const asString = await postLink({ resume: JSON.stringify({ ...designer, experience: [{ ...designer.experience[0], startDate: 'March 2021', endDate: '' }] }) });
check(
  asString.status === 200 && asString.body.warnings.some((w) => /no endDate/.test(w)) && !asString.body.warnings.some((w) => /isn't a date/.test(w)),
  'resume as a JSON string is accepted; "March 2021" parses; a missing endDate is warned about',
  asString.body.warnings?.join(' | ')
);

// 1 render
const short = await renderPdf({ template: 'classic', resume: designer });
check(short.status === 200 && short.pdfPages === 1 && short.pages === 1 && short.warnings.length === 0, 'short resume: 1-page PDF, no warnings', `status ${short.status}, header ${short.pages}, pdf ${short.pdfPages}`);

// 2 renders
const long = await renderPdf({ template: 'classic', resume: longDesigner });
const longScale = scaleIn(long.warnings);
check(long.pdfPages > 1 && long.pages === long.pdfPages, 'long resume: over one page, header matches PDF', `header ${long.pages}, pdf ${long.pdfPages}`);
if (check(longScale !== null, 'long resume: warning names a scale', long.warnings.join(' | '))) {
  const fitted = await renderPdf({ template: 'classic', scale: longScale, resume: longDesigner });
  check(fitted.pdfPages === 1 && fitted.warnings.length === 0, `long resume at scale ${longScale}: 1 page`, `pdf ${fitted.pdfPages}`);
}

const init = await mcp('initialize', { protocolVersion: '2025-06-18', capabilities: {}, clientInfo: { name: 'agent-smoke', version: '1' } });
check(init.body.result?.serverInfo?.name === 'moderncv' && init.body.result.serverInfo.icons?.length > 0, 'MCP initialize (with server icons)', init.body.result?.serverInfo?.version);
const tools = await mcp('tools/list');
check(tools.body.result?.tools?.some((t) => t.name === 'render_pdf'), 'MCP tools/list includes render_pdf', `${tools.body.result?.tools?.length} tools`);
const rawMcp = async (body) => {
  const response = await fetch(`${BASE}/mcp`, { method: 'POST', headers: { 'content-type': 'application/json', accept: 'application/json, text/event-stream' }, body: JSON.stringify(body) });
  return response.json();
};
check((await rawMcp([])).error?.code === -32600, 'MCP empty batch is an Invalid Request');
check((await rawMcp({ jsonrpc: '2.0', id: null, method: 'ping' })).error?.code === -32600, 'MCP null request id is an Invalid Request');
const noResume = await mcp('tools/call', { name: 'render_pdf', arguments: {} });
check(noResume.body.result?.isError === true && noResume.body.id === rpcId, 'MCP render_pdf without a resume is a tool error (no render spent)');

// 2 renders: MCP render_pdf, then its download link
const call = await mcp('tools/call', { name: 'render_pdf', arguments: { template: 'federal', paper: 'letter', resume: federal } });
const content = call.body.result?.content ?? [];
const summary = content[0]?.type === 'text' ? JSON.parse(content[0].text) : {};
check(!call.body.result?.isError && content.every((c) => c.type === 'text'), 'MCP render_pdf returns text only (no embedded PDF)', content.map((c) => c.type).join(', '));
const fedScale = scaleIn(summary.warnings ?? []);
check(summary.pages > 2 && fedScale !== null && /limits federal resumes to 2/.test(summary.warnings.join(' ')), 'federal over 2 pages: warning names a 2-page scale', (summary.warnings ?? []).join(' | '));
check(call.body.result?.structuredContent?.download_url === summary.download_url, 'MCP render_pdf also returns structuredContent');
if (check(typeof summary.download_url === 'string' && summary.download_url.startsWith(`${BASE}/api/agent/download/`), 'MCP render_pdf returns download_url', summary.expires_at)) {
  const download = await fetchWithRetry(summary.download_url);
  const bytes = new Uint8Array(await download.arrayBuffer());
  check(download.status === 200 && pdfPages(bytes) === summary.pages, 'download_url serves the same PDF', `status ${download.status}, pdf ${pdfPages(bytes)}, ${download.headers.get('content-disposition')}`);
  const head = await fetch(summary.download_url, { method: 'HEAD' });
  check(head.status === 200 && head.headers.get('content-type') === 'application/pdf', 'HEAD on download_url answers without rendering', `status ${head.status}`);
  const tampered = summary.download_url.replace(/\/download\/(.)/, (_, c) => `/download/${c === 'A' ? 'B' : 'A'}`);
  const bad = await fetch(tampered);
  check(bad.status === 404, 'tampered download link is rejected', `status ${bad.status}`);
}

// 1 render
if (fedScale !== null) {
  const fitted = await renderPdf({ template: 'federal', paper: 'letter', scale: fedScale, resume: federal });
  check(fitted.pdfPages === 2 && fitted.warnings.length === 0, `federal at scale ${fedScale}: 2 pages, no warnings`, `pdf ${fitted.pdfPages}`);
}

console.log(failures ? `\n${failures} check(s) failed` : '\nAll checks passed');
process.exit(failures ? 1 : 0);
