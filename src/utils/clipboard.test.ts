import { describe, expect, it } from 'vitest';
import { htmlListToText } from './clipboard';

describe('htmlListToText', () => {
  it('turns list items into "- " lines and keeps other blocks as paragraphs', () => {
    const html =
      '<meta charset="utf-8"><p>Led the platform team.</p>\n<ul>\n  <li>Cut deploy time from\n 40 to 6 minutes</li>\n  <li>Hired <b>4</b> engineers</li>\n</ul><p>Kept on-call quiet.</p>';
    expect(htmlListToText(html)).toBe(
      'Led the platform team.\n- Cut deploy time from 40 to 6 minutes\n- Hired 4 engineers\nKept on-call quiet.'
    );
  });

  it('flattens nested and ordered lists and skips empty items', () => {
    const html = '<ol><li>Parent<ul><li>Child</li></ul></li><li> </li><li>Last</li></ol>';
    expect(htmlListToText(html)).toBe('- Parent\n- Child\n- Last');
  });

  it('leaves HTML without a list to the browser', () => {
    expect(htmlListToText('<p>One</p><p>Two</p>')).toBeNull();
    expect(htmlListToText('<style>li{}</style><span>text</span>')).toBeNull();
  });
});
