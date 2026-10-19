// The header bar shared by every page. Each page holds only the placeholder below; this fills it in from
// shared/header.html, with links made relative to the page and a nav that lists every exercise (read from
// each exercise's <title>), so a new exercise appears in the header with no extra edit.
// Used by the build and dev server (vite.config.js), the HTML linter and the tests.

import { readFileSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { findExerciseFolders } from './pages.js';

export const PLACEHOLDER = '<!-- site-header -->';

// The text of the page's <title>. It is already HTML-escaped in the source ("Q &amp; A"), and cannot
// contain tags, so it is used as it is; escaping it again would double-escape it.
function titleOf(root, folder) {
  const match = readFileSync(join(root, folder, 'index.html'), 'utf8').match(/<title>([^<]+)<\/title>/);
  return match ? match[1].trim() : folder;
}

// The header HTML for the page at `filePath`.
export function renderSiteHeader(root, filePath) {
  const parts = relative(root, filePath).split(sep);
  const current = parts.length > 1 ? parts[0] : ''; // '' for the landing page
  const home = current === '' ? './' : '../';
  const shared = `${home}shared/`;
  const ariaCurrent = ' aria-current="page"';

  const links = findExerciseFolders(root)
    .map(folder => ({ folder, title: titleOf(root, folder) }))
    .sort((a, b) => a.title.localeCompare(b.title, 'en')) // fixed locale: the same order on every machine
    .map(({ folder, title }) =>
      `      <li><a href="${home}${folder}/"${folder === current ? ariaCurrent : ''}>${title}</a></li>`)
    .join('\n');

  return readFileSync(join(root, 'shared', 'header.html'), 'utf8')
    .trimEnd()
    .replace('{{home}}', home)
    .replace('{{homeCurrent}}', current === '' ? ariaCurrent : '')
    .replace('{{shared}}', shared)
    .replace('{{links}}', () => links); // a function, so "$" in a title is not special
}

// Replace the placeholder (if the page has one) with the header.
export function applySiteHeader(html, filePath, root) {
  if (!html.includes(PLACEHOLDER)) return html;
  const header = renderSiteHeader(root, filePath);
  return html.replace(PLACEHOLDER, () => header); // a function, so "$" in a title is not special
}

// Vite plugin: runs before Vite processes the page, in the build and in the dev server.
export function siteHeader(root) {
  return {
    name: 'site-header',
    transformIndexHtml: {
      order: 'pre',
      handler: (html, context) => applySiteHeader(html, context.filename, root),
    },
  };
}
