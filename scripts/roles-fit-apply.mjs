// Applies the results of scripts/roles-fit.py to src/data/roles/*.json:
// shortens each example by its measured trim level and stores `fit` (per-template scale that keeps
// it on one A4 page). Usage: node scripts/roles-fit-apply.mjs <results.json>
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { trimExample } from '../src/dev/trimExample.mjs';

const results = JSON.parse(await fs.readFile(process.argv[2], 'utf8'));
const dir = path.join(process.cwd(), 'src', 'data', 'roles');
let trimmed = 0;
let fitted = 0;
const problems = [];

for (const file of (await fs.readdir(dir)).filter((f) => f.endsWith('.json'))) {
  const full = path.join(dir, file);
  const data = JSON.parse(await fs.readFile(full, 'utf8'));
  for (const [title, example] of Object.entries(data.titles)) {
    const result = results[title];
    if (!result || result.error || result.unresolved) {
      problems.push(`${title}: ${result ? JSON.stringify(result).slice(0, 120) : 'not measured'}`);
      continue;
    }
    const { fit: _old, ...content } = example;
    const next = result.level ? trimExample(content, result.level) : content;
    if (result.level) trimmed += 1;
    if (Object.keys(result.fit).length) fitted += 1;
    data.titles[title] = Object.keys(result.fit).length ? { ...next, fit: result.fit } : next;
  }
  await fs.writeFile(full, `${JSON.stringify(data, null, 2)}\n`);
}

console.log(`Trimmed ${trimmed} examples; ${fitted} need a smaller scale in some templates.`);
if (problems.length) {
  console.log(`${problems.length} problems:\n${problems.join('\n')}`);
  process.exitCode = 1;
}
