import jobTitlesData from './jobTitles.json';
import { slugifyJobTitle } from '../utils/slug';

interface JobTitleCategory {
  name: string;
  titles: string[];
}

const FIRST_NAMES = [
  'Jordan',
  'Taylor',
  'Morgan',
  'Casey',
  'Riley',
  'Sam',
  'Jamie',
  'Avery',
  'Quinn',
  'Harper',
  'Cameron',
  'Drew',
  'Parker',
  'Reese',
  'Rowan',
  'Kai',
  'Nova',
  'Skyler',
  'Hayden',
  'Elliot',
  'Peyton',
  'Finley',
  'Emerson',
  'Dakota',
  'Sage',
  'River',
  'Logan',
  'Charlie',
  'Jules',
  'Robin',
  'Frankie',
  'Blair',
  'Sydney',
  'Jesse',
  'Marley',
  'Remy',
  'Ari',
  'Noah',
  'Liam',
  'Mason',
  'Lucas',
  'Ethan',
  'Leo',
  'Owen',
  'Aiden',
  'Elijah',
  'Grace',
  'Mia',
  'Emma',
  'Ava',
  'Zoe',
  'Nora',
  'Ivy',
  'Chloe',
  'Sofia',
  'Aria',
  'Leah',
];

const LAST_NAMES = [
  'Kim',
  'Patel',
  'Chen',
  'Singh',
  'Nguyen',
  'Garcia',
  'Martinez',
  'Lopez',
  'Gonzalez',
  'Hernandez',
  'Rodriguez',
  'Johnson',
  'Williams',
  'Brown',
  'Jones',
  'Miller',
  'Davis',
  'Wilson',
  'Anderson',
  'Thomas',
  'Taylor',
  'Moore',
  'Jackson',
  'Martin',
  'Lee',
  'Perez',
  'Thompson',
  'White',
  'Harris',
  'Sanchez',
  'Clark',
  'Ramirez',
  'Lewis',
  'Robinson',
  'Walker',
  'Young',
  'Allen',
  'King',
  'Wright',
  'Scott',
  'Torres',
  'Hill',
  'Flores',
  'Green',
  'Adams',
  'Nelson',
  'Baker',
  'Hall',
  'Rivera',
  'Campbell',
  'Mitchell',
  'Carter',
  'Roberts',
  'Phillips',
  'Evans',
  'Turner',
  'Parker',
];

const indexToLetters = (index1Based: number): string => {
  let n = index1Based;
  let out = '';
  while (n > 0) {
    n -= 1;
    out = String.fromCharCode(65 + (n % 26)) + out;
    n = Math.floor(n / 26);
  }
  return out;
};

const nameFromIndex = (index: number): string => {
  const firstCount = FIRST_NAMES.length;
  const lastCount = LAST_NAMES.length;
  const base = firstCount * lastCount;

  const baseIndex = index % base;
  const cycle = Math.floor(index / base);

  const first = FIRST_NAMES[baseIndex % firstCount] ?? 'Jordan';
  const last = LAST_NAMES[Math.floor(baseIndex / firstCount)] ?? 'Kim';

  if (cycle === 0) return `${first} ${last}`;
  const middle = indexToLetters(cycle);
  return `${first} ${middle}. ${last}`;
};

const hashString = (value: string): number => {
  let hash = 2166136261;
  for (let i = 0; i < value.length; i += 1) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
};

const categories = jobTitlesData as JobTitleCategory[];
const allTitles = categories.flatMap((category) => category.titles);

// Each title gets the name its slug hashes to (the next free one on a collision), so adding titles
// later doesn't rename the people on existing job pages, and every title still gets a unique name.
const NAME_SLOTS = FIRST_NAMES.length * LAST_NAMES.length;
const FULL_NAME_BY_SLUG = new Map<string, string>();
const takenSlots = new Set<number>();
for (const slug of allTitles.map(slugifyJobTitle).sort((a, b) => a.localeCompare(b, 'en'))) {
  let slot = hashString(slug) % NAME_SLOTS;
  while (takenSlots.has(slot)) slot = (slot + 1) % NAME_SLOTS;
  takenSlots.add(slot);
  FULL_NAME_BY_SLUG.set(slug, nameFromIndex(slot));
}

export const getPersonaFullNameForJobTitle = (jobTitle: string): string => {
  const slug = slugifyJobTitle(jobTitle);
  return FULL_NAME_BY_SLUG.get(slug) ?? nameFromIndex(hashString(slug));
};

