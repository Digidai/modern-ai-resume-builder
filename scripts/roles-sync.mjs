#!/usr/bin/env node
// Merges src/data/roles/*.json (example resumes per job family) into the directory data:
//  - new titles are appended to their family in src/data/jobTitles.json (new families are appended),
//  - guides of new families are added to src/data/roleGuides.json.
// Then reports titles without an example, duplicates and slug collisions. Exits 1 on problems.
// Usage: node scripts/roles-sync.mjs [--check]   (--check reports without writing)
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { slugifyJobTitle } from './slugify.mjs';

const root = process.cwd();
const rolesDir = path.join(root, 'src', 'data', 'roles');
const jobTitlesPath = path.join(root, 'src', 'data', 'jobTitles.json');
const guidesPath = path.join(root, 'src', 'data', 'roleGuides.json');
const checkOnly = process.argv.includes('--check');

const readJson = async (file) => JSON.parse(await fs.readFile(file, 'utf8'));

const files = (await fs.readdir(rolesDir)).filter((f) => f.endsWith('.json')).sort();
const families = new Map(); // family -> { guide, titles: Map<title, example> }
for (const file of files) {
  const data = await readJson(path.join(rolesDir, file));
  if (!data.family || !data.titles) throw new Error(`${file}: missing "family" or "titles"`);
  const entry = families.get(data.family) ?? { guide: null, titles: new Map() };
  if (data.guide) entry.guide = data.guide;
  for (const [title, example] of Object.entries(data.titles)) entry.titles.set(title, example);
  families.set(data.family, entry);
}

const jobTitles = await readJson(jobTitlesPath);
const guides = await readJson(guidesPath);
let added = 0;
for (const [family, { guide, titles }] of families) {
  let category = jobTitles.find((c) => c.name === family);
  if (!category) {
    category = { name: family, titles: [] };
    jobTitles.push(category);
  }
  for (const title of titles.keys()) {
    if (!category.titles.includes(title)) {
      category.titles.push(title);
      added += 1;
    }
  }
  if (!guides.categories[family]) {
    if (!guide) console.warn(`! New family "${family}" has no guide; job pages will use the fallback guide.`);
    else guides.categories[family] = guide;
  }
}

// Report.
const problems = [];
const seenTitles = new Map();
const seenSlugs = new Map();
let withExample = 0;
for (const category of jobTitles) {
  const examples = families.get(category.name)?.titles;
  for (const title of category.titles) {
    if (seenTitles.has(title)) problems.push(`Duplicate title "${title}" in ${seenTitles.get(title)} and ${category.name}`);
    seenTitles.set(title, category.name);
    const slug = slugifyJobTitle(title);
    if (seenSlugs.has(slug) && seenSlugs.get(slug) !== title) problems.push(`Slug collision "${slug}": "${seenSlugs.get(slug)}" vs "${title}"`);
    seenSlugs.set(slug, title);
    if (examples?.has(title)) withExample += 1;
    else problems.push(`No example for "${title}" (${category.name})`);
  }
}

const total = jobTitles.reduce((n, c) => n + c.titles.length, 0);
console.log(`${jobTitles.length} families, ${total} titles (${added} new), ${withExample} with examples.`);
if (!checkOnly) {
  await fs.writeFile(jobTitlesPath, `${JSON.stringify(jobTitles, null, 2)}\n`);
  await fs.writeFile(guidesPath, `${JSON.stringify(guides, null, 2)}\n`);
}
if (problems.length) {
  console.error(`${problems.length} problem(s):\n${problems.map((p) => `- ${p}`).join('\n')}`);
  process.exitCode = 1;
}
