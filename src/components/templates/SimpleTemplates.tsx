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

/** Montserrat, bold headings over a short accent stroke. */
export const CobaltTemplate = createSimpleTemplate({ font: 'font-montserrat', accent: '#1D4ED8', header: 'left', heading: 'short', dates: 'right', company: 'accent' });

/** IBM Plex Serif, name left and contacts stacked right, headings over a rule. */
export const GraniteTemplate = createSimpleTemplate({ font: 'font-plex-serif', accent: '#374151', header: 'split', heading: 'rule', dates: 'right', company: 'italic' });

/** Source Sans, headings with a trailing rule, dates in a left column. */
export const BedrockTemplate = createSimpleTemplate({ font: 'font-source-sans', accent: '#0F4C5C', header: 'left', heading: 'line', dates: 'column', company: 'accent' });

/** Latin Modern (the LaTeX face), centred header, "Role, Employer" on one line. */
export const LinearTemplate = createSimpleTemplate({ font: 'font-latin-modern', accent: '#222222', header: 'center', heading: 'rule', dates: 'right', company: 'inline' });

/** Raleway with a round photo on the right and short-stroke headings. */
export const VistaTemplate = createSimpleTemplate({ font: 'font-raleway', accent: '#0369A1', header: 'left', heading: 'short', dates: 'right', company: 'accent', icons: true, photo: { side: 'right', shape: 'round' } });

/** 3:4 photo left, name centre, contacts stacked right, tinted headings. */
export const EmberTemplate = createSimpleTemplate({ font: 'font-source-sans', accent: '#B45309', header: 'split', heading: 'tint', dates: 'right', company: 'accent', icons: true, photo: { side: 'left', shape: 'rect' } });

/** Round photo left, headings with a trailing rule, dates in a left column. */
export const SageTemplate = createSimpleTemplate({ font: 'font-lato', accent: '#3F6212', header: 'left', heading: 'line', dates: 'column', company: 'italic', icons: true, photo: { side: 'left', shape: 'round' } });

/** EB Garamond, centred header, ruled headings, employer in the accent colour. */
export const FolioTemplate = createSimpleTemplate({ font: 'font-garamond', accent: '#1F3A5F', header: 'center', heading: 'rule', dates: 'right', company: 'accent' });

/** Lato, contacts stacked right, dates in a left column. */
export const SlateTemplate = createSimpleTemplate({ font: 'font-lato', accent: '#334155', header: 'split', heading: 'line', dates: 'column', company: 'italic' });

/** Charis, centred 3:4 photo above the name, tinted headings. */
export const MarbleTemplate = createSimpleTemplate({ font: 'font-charis', accent: '#57534E', header: 'center', heading: 'tint', dates: 'right', company: 'italic', icons: true, photo: { side: 'top', shape: 'rect' } });

/** Lato, round photo right, dates in a left column. */
export const WillowTemplate = createSimpleTemplate({ font: 'font-lato', accent: '#0F766E', header: 'left', heading: 'rule', dates: 'column', company: 'accent', icons: true, photo: { side: 'right', shape: 'round' } });

/** Source Serif, 3:4 photo left, capitalised name, accent bars. */
export const IvoryTemplate = createSimpleTemplate({ font: 'font-source-serif', accent: '#1E3A5F', header: 'left', upperName: true, heading: 'bar', dates: 'right', company: 'inline', icons: true, photo: { side: 'left', shape: 'rect' } });

