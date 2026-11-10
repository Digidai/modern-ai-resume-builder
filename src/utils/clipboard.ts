const BLOCK_TAGS = /^(P|DIV|LI|UL|OL|H[1-6]|BR|TR|BLOCKQUOTE|SECTION|ARTICLE|HEADER|FOOTER)$/;
const SKIP_TAGS = /^(SCRIPT|STYLE|HEAD|TITLE|META|TEMPLATE)$/;

/**
 * Plain text for clipboard HTML that holds a list (Google Docs, web pages, LinkedIn), with each list
 * item as a "- " line, which is how the editor writes bullets. Browsers drop the markers when they
 * paste such HTML as text, so the items would otherwise become paragraphs. Returns null when the
 * HTML has no list, so the browser's own paste is kept.
 */
export const htmlListToText = (html: string): string | null => {
  const doc = new DOMParser().parseFromString(html, 'text/html');
  if (!doc.querySelector('li')) return null;

  const lines: string[] = [];
  let line = '';
  const flush = () => {
    const text = line.replace(/\s+/g, ' ').trim();
    if (text && text !== '-') lines.push(text);
    line = '';
  };
  const walk = (node: Node) => {
    if (node.nodeType === Node.TEXT_NODE) {
      line += node.textContent ?? '';
      return;
    }
    if (!(node instanceof Element) || SKIP_TAGS.test(node.tagName)) return;
    const block = BLOCK_TAGS.test(node.tagName);
    if (block) flush();
    if (node.tagName === 'LI') line = '- ';
    node.childNodes.forEach(walk);
    if (block) flush();
  };
  walk(doc.body);
  return lines.length ? lines.join('\n') : null;
};
