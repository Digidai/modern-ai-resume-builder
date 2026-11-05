import { createSimpleTemplate } from './simpleLayout';

// Clean, classic single-column templates built on the shared simple layout. The first five have no
// photo and stay ATS-friendly (plain-text contacts, standard headings, reading order); the last
// five add a photo for markets that expect one.

/** Inter, left header, caps headings over a rule, dates on the right, employer in the accent. */
export const ClarityTemplate = createSimpleTemplate({ font: 'font-inter', accent: '#1F4E79', header: 'left', heading: 'rule', dates: 'right', company: 'accent' });

/** Serif, centred name and contacts, headings with a rule to the right, employer in italics. */
export const HarborTemplate = createSimpleTemplate({ font: 'font-source-serif', accent: '#2F3E46', header: 'center', heading: 'line', dates: 'right', company: 'italic' });

/** Roboto, name left and contacts stacked right, accent-bar headings. */
export const MetroTemplate = createSimpleTemplate({ font: 'font-roboto', accent: '#0F766E', header: 'split', heading: 'bar', dates: 'right', company: 'accent' });

/** Lato, tinted heading bands, "Role, Employer" on one line. */
export const AtlasTemplate = createSimpleTemplate({ font: 'font-lato', accent: '#334155', header: 'left', heading: 'tint', dates: 'right', company: 'inline' });

/** Garamond, dates in a left column, headings over a short accent stroke. */
export const ChronicleTemplate = createSimpleTemplate({ font: 'font-garamond', accent: '#7A2E2E', header: 'left', heading: 'short', dates: 'column', company: 'italic' });

/** Inter with a 3:4 photo on the right and icon contacts. */
export const AuroraTemplate = createSimpleTemplate({ font: 'font-inter', accent: '#2563EB', header: 'left', heading: 'rule', dates: 'right', company: 'accent', icons: true, photo: { side: 'right', shape: 'rect' } });

/** Centred round photo above the name, headings with a rule to the right. */
export const NovaTemplate = createSimpleTemplate({ font: 'font-lato', accent: '#0E7490', header: 'center', heading: 'line', dates: 'right', company: 'italic', icons: true, photo: { side: 'top', shape: 'round' } });

/** Round photo on the left, name in the middle, contacts stacked on the right. */
export const CameoTemplate = createSimpleTemplate({ font: 'font-source-sans', accent: '#4338CA', header: 'split', heading: 'bar', dates: 'right', company: 'accent', icons: true, photo: { side: 'left', shape: 'round' } });

/** Times, name in capitals, plain-text contacts and a small 3:4 photo on the right. */
export const SterlingTemplate = createSimpleTemplate({ font: 'font-tinos', accent: '#1E3A5F', header: 'left', upperName: true, heading: 'rule', dates: 'right', company: 'italic', photo: { side: 'right', shape: 'rect' } });

/** 3:4 photo on the left, tinted headings, dates in a left column. */
export const MeadowTemplate = createSimpleTemplate({ font: 'font-roboto', accent: '#15803D', header: 'left', heading: 'tint', dates: 'column', company: 'accent', icons: true, photo: { side: 'left', shape: 'rect' } });
