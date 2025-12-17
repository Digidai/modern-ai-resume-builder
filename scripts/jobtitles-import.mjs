import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { slugifyJobTitle } from './slugify.mjs';

const projectRoot = process.cwd();
const jobTitlesPath = path.join(projectRoot, 'src', 'data', 'jobTitles.json');

const readJson = (filePath) => JSON.parse(readFileSync(filePath, 'utf8'));

const writeJson = (filePath, data) => {
  const json = `${JSON.stringify(data, null, 2)}\n`;
  writeFileSync(filePath, json);
};

const parseArgs = (argv) => {
  const args = { input: null, category: null, format: null, dryRun: false, sort: true };

  for (let i = 0; i < argv.length; i++) {
    const token = argv[i];
    if (token === '--input' || token === '-i') {
      args.input = argv[++i] ?? null;
      continue;
    }
    if (token === '--category' || token === '-c') {
      args.category = argv[++i] ?? null;
      continue;
    }
    if (token === '--format' || token === '-f') {
      args.format = argv[++i] ?? null;
      continue;
    }
    if (token === '--dry-run') {
      args.dryRun = true;
      continue;
    }
    if (token === '--no-sort') {
      args.sort = false;
      continue;
    }
    if (token === '--help' || token === '-h') {
      return { ...args, help: true };
    }
  }

  return args;
};

const inferFormat = (filePath) => {
  const ext = path.extname(filePath).toLowerCase();
  if (ext === '.csv') return 'csv';
  if (ext === '.tsv') return 'tsv';
  return 'txt';
};

const normalizeTitle = (value) => value.trim().replace(/\s+/g, ' ');

const ensureCategory = (categories, name) => {
  const existing = categories.find((c) => c.name === name);
  if (existing) return existing;
  const created = { name, titles: [] };
  categories.push(created);
  return created;
};

const parseDelimited = (contents, delimiter) => {
  const lines = contents.split(/\r?\n/);
  const rows = [];
  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;
    const idx = line.indexOf(delimiter);
    if (idx === -1) continue;
    const category = normalizeTitle(line.slice(0, idx));
    const title = normalizeTitle(line.slice(idx + 1));
    if (!category || !title) continue;
    rows.push({ category, title });
  }
  return rows;
};

const parseTxtWithSections = (contents, fallbackCategory) => {
  const lines = contents.split(/\r?\n/);
  const rows = [];
  let currentCategory = fallbackCategory;

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;

    const section = line.match(/^\[(.+?)\]$/);
    if (section) {
      currentCategory = normalizeTitle(section[1]);
      continue;
    }

    const title = normalizeTitle(line);
    const category = currentCategory || 'Uncategorized';
    rows.push({ category, title });
  }

  return rows;
};

const validateNoSlugCollisions = (categories) => {
  const slugToTitles = new Map();
  for (const category of categories) {
    for (const title of category.titles) {
      const slug = slugifyJobTitle(title);
      const list = slugToTitles.get(slug) ?? [];
      list.push(title);
      slugToTitles.set(slug, list);
    }
  }

  const collisions = [...slugToTitles.entries()].filter(([, titles]) => titles.length > 1);
  if (collisions.length === 0) return;

  const preview = collisions
    .slice(0, 20)
    .map(([slug, titles]) => `${slug}: ${titles.join(' | ')}`)
    .join('; ');
  throw new Error(`Slug collisions detected (${collisions.length}): ${preview}`);
};

const main = () => {
  const args = parseArgs(process.argv.slice(2));
  if (args.help || !args.input) {
    console.log(`Usage:
  node scripts/jobtitles-import.mjs --input <file> [--format csv|tsv|txt] [--category <name>] [--dry-run] [--no-sort]

Formats:
  csv/tsv: category,title
  txt: one title per line, optional [Category] section headers

Examples:
  node scripts/jobtitles-import.mjs -i titles.txt -c "Engineering"
  node scripts/jobtitles-import.mjs -i titles.csv
  node scripts/jobtitles-import.mjs -i titles.txt --dry-run
`);
    process.exit(args.help ? 0 : 1);
  }

  const format = (args.format || inferFormat(args.input)).toLowerCase();
  const inputPath = path.isAbsolute(args.input) ? args.input : path.join(projectRoot, args.input);
  const contents = readFileSync(inputPath, 'utf8');

  const categories = readJson(jobTitlesPath);
  if (!Array.isArray(categories)) throw new Error(`Expected an array in ${jobTitlesPath}`);

  const existingTitles = new Set(categories.flatMap((c) => (Array.isArray(c.titles) ? c.titles : [])));

  let rows = [];
  if (format === 'csv') rows = parseDelimited(contents, ',');
  else if (format === 'tsv') rows = parseDelimited(contents, '\t');
  else rows = parseTxtWithSections(contents, args.category);

  let added = 0;
  let skipped = 0;

  for (const row of rows) {
    const title = normalizeTitle(row.title);
    if (!title) continue;

    if (existingTitles.has(title)) {
      skipped++;
      continue;
    }

    const categoryName = normalizeTitle(row.category || args.category || 'Uncategorized');
    const category = ensureCategory(categories, categoryName);

    category.titles.push(title);
    existingTitles.add(title);
    added++;
  }

  if (args.sort) {
    for (const category of categories) {
      category.titles = [...new Set(category.titles.map((t) => normalizeTitle(t)))].sort((a, b) =>
        a.localeCompare(b, 'en', { sensitivity: 'base' })
      );
    }
  }

  validateNoSlugCollisions(categories);

  const summary = { added, skipped, categories: categories.length, titles: existingTitles.size };

  if (args.dryRun) {
    console.log(JSON.stringify({ dryRun: true, ...summary }, null, 2));
    return;
  }

  writeJson(jobTitlesPath, categories);
  console.log(JSON.stringify({ dryRun: false, ...summary }, null, 2));
};

try {
  main();
} catch (err) {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
}
