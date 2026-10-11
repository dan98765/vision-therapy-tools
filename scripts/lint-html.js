// Validates the HTML of the landing page, every exercise and the template with html-validate.
// Rules come from .htmlvalidate.json. Exits 1 if anything is reported.

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { FileSystemConfigLoader, HtmlValidate } from 'html-validate/node';
import { findExerciseFolders } from './pages.js';
import { applySiteHeader } from './site-header.js';

const root = resolve(import.meta.dirname, '..');
const files = [
  'index.html',
  ...findExerciseFolders(root, { includeTemplates: true }).map(name => `${name}/index.html`),
];

const validator = new HtmlValidate(new FileSystemConfigLoader());
let problems = 0;

for (const file of files) {
  // Validate the page as it will be built, with the shared header filled in
  const path = resolve(root, file);
  const report = await validator.validateString(applySiteHeader(readFileSync(path, 'utf8'), path, root), path);
  for (const result of report.results) {
    for (const message of result.messages) {
      console.error(`${file}:${message.line}:${message.column}  ${message.message}  (${message.ruleId})`);
      problems++;
    }
  }
}

console.log(problems ? `${problems} HTML problem(s)` : `${files.length} HTML files OK`);
process.exit(problems ? 1 : 0);
