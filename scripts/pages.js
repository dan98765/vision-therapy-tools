// Finds the exercise folders. Shared by the build (vite.config.js), the HTML linter and the tests,
// so they cannot disagree about what counts as a page.

import { existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

// Top-level folders that are tooling or notes, not exercises
const NOT_EXERCISES = new Set(['node_modules', 'dist', 'docs', 'scripts', 'shared', 'tests']);

// Every top-level folder with an index.html. Folders starting with "." are never included, and
// folders starting with "_" (like _template) only when `includeTemplates` is set.
export function findExerciseFolders(root, { includeTemplates = false } = {}) {
  return readdirSync(root, { withFileTypes: true })
    .filter(entry => entry.isDirectory())
    .map(entry => entry.name)
    .filter(name => !name.startsWith('.') && !NOT_EXERCISES.has(name))
    .filter(name => includeTemplates || !name.startsWith('_'))
    .filter(name => existsSync(join(root, name, 'index.html')));
}
