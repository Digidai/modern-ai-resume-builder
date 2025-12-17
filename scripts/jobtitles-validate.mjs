import { readFileSync } from 'node:fs';
import path from 'node:path';
import { slugifyJobTitle } from './slugify.mjs';

const jobTitlesPath = path.join(process.cwd(), 'src', 'data', 'jobTitles.json');

const readJson = (filePath) => JSON.parse(readFileSync(filePath, 'utf8'));

const main = () => {
  const categories = readJson(jobTitlesPath);
  if (!Array.isArray(categories)) {
    throw new Error(`Expected an array in ${jobTitlesPath}`);
  }

  const allTitles = [];
  const seenTitles = new Set();
  const duplicateTitles = new Set();
  const slugToTitles = new Map();

  for (const category of categories) {
    if (!category || typeof category !== 'object') {
      throw new Error(`Each category must be an object in ${jobTitlesPath}`);
    }
    if (typeof category.name !== 'string' || !category.name.trim()) {
      throw new Error(`Each category must have a non-empty 'name' in ${jobTitlesPath}`);
    }
    if (!Array.isArray(category.titles)) {
      throw new Error(`Category '${category.name}' must have a 'titles' array in ${jobTitlesPath}`);
    }

    for (const rawTitle of category.titles) {
      if (typeof rawTitle !== 'string') {
        throw new Error(`Job title must be a string in category '${category.name}'`);
      }
      const title = rawTitle.trim();
      if (!title) continue;

      allTitles.push(title);

      if (seenTitles.has(title)) duplicateTitles.add(title);
      seenTitles.add(title);

      const slug = slugifyJobTitle(title);
      const list = slugToTitles.get(slug) ?? [];
      list.push(title);
      slugToTitles.set(slug, list);
    }
  }

  const slugCollisions = [...slugToTitles.entries()].filter(([, titles]) => titles.length > 1);

  if (duplicateTitles.size > 0 || slugCollisions.length > 0) {
    const parts = [];
    if (duplicateTitles.size > 0) {
      parts.push(`Duplicate titles (${duplicateTitles.size}): ${[...duplicateTitles].sort().join(', ')}`);
    }
    if (slugCollisions.length > 0) {
      const preview = slugCollisions
        .slice(0, 20)
        .map(([slug, titles]) => `${slug}: ${titles.join(' | ')}`)
        .join('; ');
      parts.push(`Slug collisions (${slugCollisions.length}): ${preview}`);
    }
    throw new Error(parts.join('\n'));
  }

  console.log(
    JSON.stringify(
      {
        categories: categories.length,
        titles: allTitles.length,
        slugs: slugToTitles.size,
      },
      null,
      2
    )
  );
};

try {
  main();
} catch (err) {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
}

