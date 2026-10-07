// Validates the HTML of the landing page, every exercise and the template with html-validate.
// Rules come from .htmlvalidate.json. Exits 1 if anything is reported.

import { resolve } from 'node:path';
import { FileSystemConfigLoader, HtmlValidate } from 'html-validate/node';
import { findExerciseFolders } from './pages.js';

const root = resolve(import.meta.dirname, '..');
const files = [
  'index.html',
  ...findExerciseFolders(root, { includeTemplates: true }).map(name => `${name}/index.html`),
];

const validator = new HtmlValidate(new FileSystemConfigLoader());
let problems = 0;

for (const file of files) {
  const report = await validator.validateFile(resolve(root, file));
  for (const result of report.results) {
    for (const message of result.messages) {
      console.error(`${file}:${message.line}:${message.column}  ${message.message}  (${message.ruleId})`);
      problems++;
    }
  }
}

console.log(problems ? `${problems} HTML problem(s)` : `${files.length} HTML files OK`);
process.exit(problems ? 1 : 0);
