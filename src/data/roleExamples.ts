import type { RoleExample, RoleFile } from '../shared/roleExample.mjs';
import { slugifyJobTitle } from '../utils/slug';

export type { RoleExample };

const familySlug = (family: string) => family.toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

/** Dev only: read the source family files (src/data/roles/<family>[-n].json) directly. */
const loadFromSource = async (title: string, family?: string): Promise<RoleExample | null> => {
  const files = import.meta.glob<{ default: RoleFile }>('./roles/*.json');
  const prefix = family ? `./roles/${familySlug(family)}` : './roles/';
  const keys = Object.keys(files).filter((key) => key.startsWith(prefix));
  for (const key of keys.length ? keys : Object.keys(files)) {
    const file = (await files[key]()).default;
    if (file.titles[title]) return file.titles[title];
  }
  return null;
};

// Examples loaded so far, by job-title slug (null: the title has none).
const loaded = new Map<string, RoleExample | null>();

const fetchExample = async (slug: string): Promise<RoleExample | null | undefined> => {
  try {
    const response = await fetch(`/role-examples/${slug}.json`);
    if (response.ok) return (await response.json()) as RoleExample;
    return response.status === 404 ? null : undefined;
  } catch {
    return undefined;
  }
};

/**
 * The example resume for a job title, or null if there is none. Production builds fetch the one
 * small /role-examples/<slug>.json file written by scripts/seo-postbuild.mjs.
 */
export const loadRoleExample = async (title: string, family?: string): Promise<RoleExample | null> => {
  const slug = slugifyJobTitle(title);
  const cached = loaded.get(slug);
  if (cached !== undefined) return cached;
  const found = import.meta.env.DEV || import.meta.env.SSR ? await loadFromSource(title, family) : await fetchExample(slug);
  if (found !== undefined) loaded.set(slug, found);
  return found ?? null;
};

/** The example for a title if it has already been loaded, else undefined. */
export const getLoadedRoleExample = (title: string): RoleExample | null | undefined => loaded.get(slugifyJobTitle(title));

/** Loads a job page's example before hydration, so the first render matches the prerendered page. */
export const preloadRoleExample = async (slug: string): Promise<void> => {
  if (import.meta.env.DEV || loaded.has(slug)) return;
  const found = await fetchExample(slug);
  if (found !== undefined) loaded.set(slug, found);
};
