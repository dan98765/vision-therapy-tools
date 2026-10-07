// Checks that every page follows the conventions in CLAUDE.md, so a new exercise
// or a copy of _template/ cannot quietly break them.

import { existsSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { findExerciseFolders } from '../scripts/pages.js';

const root = resolve(import.meta.dirname, '..');
const read = file => readFileSync(join(root, file), 'utf8');

const folders = findExerciseFolders(root, { includeTemplates: true });
const exercises = findExerciseFolders(root);

// [label, path of index.html]; the template is included in the checks because people copy it
const pages = [
  ['landing page', 'index.html'],
  ...folders.map(name => [name, `${name}/index.html`]),
];

function attributeValues(html, attribute) {
  return [...html.matchAll(new RegExp(`\\b${attribute}="([^"]*)"`, 'g'))].map(m => m[1]);
}

describe('page discovery', () => {
  it('finds the exercises', () => {
    expect(exercises).toContain('macdonald-form-field-cards');
    expect(exercises).toContain('hart-chart');
  });
});

describe.each(pages)('%s', (label, file) => {
  const html = read(file);
  const isLanding = file === 'index.html';

  it('has a title', () => {
    expect(html).toMatch(/<title>[^<]+<\/title>/);
  });

  it('has a strict Content-Security-Policy that blocks everything by default', () => {
    const csp = html.match(/http-equiv="Content-Security-Policy" content="([^"]+)"/)?.[1];
    expect(csp, 'CSP meta tag').toBeDefined();
    expect(csp).toContain("default-src 'none'");
    expect(csp).not.toMatch(/unsafe-inline|unsafe-eval|https?:|\*/);
  });

  it('has no inline scripts, styles or style attributes', () => {
    expect(html).not.toMatch(/<script(?![^>]*\bsrc=)[^>]*>/);
    expect(html).not.toMatch(/<style[\s>]/);
    expect(html).not.toMatch(/\sstyle="/);
  });

  it('uses relative paths only', () => {
    for (const value of [...attributeValues(html, 'href'), ...attributeValues(html, 'src')]) {
      expect(value, value).not.toMatch(/^(\/|https?:|\/\/)/);
    }
  });

  it('only references files that exist', () => {
    for (const value of [...attributeValues(html, 'href'), ...attributeValues(html, 'src')]) {
      if (!value.startsWith('.')) continue;
      const target = resolve(root, dirname(file), value);
      expect(existsSync(target), `${value} from ${file}`).toBe(true);
    }
  });

  it('has the not-medical-advice footer', () => {
    expect(html).toContain('class="disclaimer"');
    expect(html).toContain('Not medical advice');
  });

  it('gives every control a label', () => {
    const labelled = new Set(attributeValues(html, 'for'));
    for (const block of html.matchAll(/<label[^>]*>([\s\S]*?)<\/label>/g)) {
      for (const id of attributeValues(block[1], 'id')) labelled.add(id);
    }
    const controls = [...html.matchAll(/<(?:input|select|textarea)\b[^>]*\bid="([^"]+)"/g)].map(m => m[1]);
    for (const id of controls) expect(labelled.has(id), `#${id} has no label`).toBe(true);
  });

  if (!isLanding) {
    it('links back to the landing page', () => {
      expect(html).toContain('<a class="back" href="../">');
    });
  }
});

describe.each(exercises)('exercise %s', name => {
  it('is listed on the landing page', () => {
    expect(attributeValues(read('index.html'), 'href')).toContain(`./${name}/`);
  });

  it('is listed in the README', () => {
    expect(read('README.md')).toContain(`/${name}/`);
  });

  it('has a notes file in docs/', () => {
    expect(existsSync(join(root, 'docs', `${name}.md`)), `docs/${name}.md`).toBe(true);
  });
});
