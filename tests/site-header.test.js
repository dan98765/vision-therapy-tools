import { existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { afterAll, describe, expect, it } from 'vitest';
import { PLACEHOLDER, applySiteHeader, renderSiteHeader, siteHeader } from '../scripts/site-header.js';
import { UNITS } from '../shared/units.js';

const root = resolve(import.meta.dirname, '..');
const page = file => join(root, file);
const count = (text, needle) => text.split(needle).length - 1;

describe('the header for the real pages', () => {
  const landing = renderSiteHeader(root, page('index.html'));
  const cards = renderSiteHeader(root, page('macdonald-form-field-cards/index.html'));
  const hart = renderSiteHeader(root, page('hart-chart/index.html'));

  it('links to every exercise by its page title', () => {
    for (const header of [landing, cards, hart]) {
      expect(header).toContain('>Hart Chart Generator</a>');
      expect(header).toContain('>Macdonald Form Field Cards</a>');
      expect(header).toContain('>Vision Therapy Tools</a>');
    }
  });

  it('uses links relative to the page: ./ at the top level, ../ inside an exercise', () => {
    expect(landing).toContain('href="./"');
    expect(landing).toContain('href="./hart-chart/"');
    expect(hart).toContain('href="../"');
    expect(hart).toContain('href="../macdonald-form-field-cards/"');
    expect(hart).not.toMatch(/href="\.\/hart-chart/);
  });

  it('marks exactly one link as the current page', () => {
    for (const header of [landing, cards, hart]) expect(count(header, 'aria-current="page"')).toBe(1);
    expect(landing).toMatch(/class="site-title" href="\.\/" aria-current="page"/);
    expect(hart).toMatch(/href="\.\.\/hart-chart\/" aria-current="page">Hart Chart Generator/);
    expect(cards).toMatch(/href="\.\.\/macdonald-form-field-cards\/" aria-current="page">Macdonald/);
  });

  it('marks nothing as current on a page that is not an exercise, such as the template', () => {
    expect(count(renderSiteHeader(root, page('_template/index.html')), 'aria-current')).toBe(0);
  });

  it('has the Units control, offering the same units the maths knows, and the script that runs it', () => {
    for (const header of [landing, cards, hart]) {
      const options = [...header.matchAll(/<option value="(\w+)">/g)].map(m => m[1]);
      expect(options).toEqual(UNITS);
      expect(header).toContain('<select id="units">');
    }
    expect(landing).toContain('<script type="module" src="./shared/header.js"></script>');
    expect(hart).toContain('<script type="module" src="../shared/header.js"></script>');
    expect(existsSync(join(root, 'shared', 'header.js'))).toBe(true);
  });

  it('leaves no unfilled {{token}} behind', () => {
    for (const header of [landing, cards, hart]) expect(header).not.toMatch(/\{\{|\}\}/);
  });
});

describe('applySiteHeader', () => {
  it('replaces the placeholder and leaves the rest of the page alone', () => {
    const html = `<body>\n  ${PLACEHOLDER}\n  <h1>x</h1>\n</body>`;
    const out = applySiteHeader(html, page('index.html'), root);
    expect(out).not.toContain(PLACEHOLDER);
    expect(out).toContain('<header class="site-header">');
    expect(out.endsWith('  <h1>x</h1>\n</body>')).toBe(true);
  });

  it('returns a page without the placeholder unchanged', () => {
    expect(applySiteHeader('<body></body>', page('index.html'), root)).toBe('<body></body>');
  });
});

describe('titles are used as written in the page', () => {
  const fixture = mkdtempSync(join(tmpdir(), 'site-header-'));
  afterAll(() => rmSync(fixture, { recursive: true, force: true }));

  mkdirSync(join(fixture, 'shared'));
  writeFileSync(join(fixture, 'shared', 'header.html'), '<header>{{home}}|{{links}}</header>');
  const titles = { one: 'Q &amp; A', two: "Price $' and $` and $&amp;", three: 'a < b' };
  for (const [folder, title] of Object.entries(titles)) {
    mkdirSync(join(fixture, folder));
    writeFileSync(join(fixture, folder, 'index.html'), `<title>${title}</title>`);
  }

  it('does not escape a title a second time', () => {
    const out = renderSiteHeader(fixture, join(fixture, 'index.html'));
    expect(out).toContain('>Q &amp; A</a>');
    expect(out).not.toContain('&amp;amp;');
  });

  it('keeps $ sequences in a title literally', () => {
    const out = applySiteHeader('<body><!-- site-header --></body>', join(fixture, 'index.html'), fixture);
    expect(out).toContain("Price $' and $` and $&amp;");
  });

  it('falls back to the folder name when a title cannot be read as plain text', () => {
    expect(renderSiteHeader(fixture, join(fixture, 'index.html'))).toContain('>three</a>');
  });
});

describe('Vite plugin', () => {
  it('runs before Vite processes the page', () => {
    const plugin = siteHeader(root);
    expect(plugin.name).toBe('site-header');
    expect(plugin.transformIndexHtml.order).toBe('pre');
    const out = plugin.transformIndexHtml.handler(`<body>${PLACEHOLDER}</body>`, { filename: page('hart-chart/index.html') });
    expect(out).toContain('href="../hart-chart/" aria-current="page"');
  });
});
