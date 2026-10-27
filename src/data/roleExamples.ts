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

/**
 * The example resume for a job title, or null if there is none. Production builds fetch the one
 * small /role-examples/<slug>.json file written by scripts/seo-postbuild.mjs.
 */
export const loadRoleExample = async (title: string, family?: string): Promise<RoleExample | null> => {
  if (import.meta.env.DEV) return loadFromSource(title, family);
  try {
    const response = await fetch(`/role-examples/${slugifyJobTitle(title)}.json`);
    return response.ok ? ((await response.json()) as RoleExample) : null;
  } catch {
    return null;
  }
};
