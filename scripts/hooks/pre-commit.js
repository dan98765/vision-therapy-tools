// pre-commit: block a commit with the wrong git identity, lint errors or failing tests.
// Skip in an emergency with `git commit --no-verify` (CI runs lint and tests again).

import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { identityProblem } from './checks.js';

const root = resolve(import.meta.dirname, '..', '..');

function fail(message) {
  console.error(`\npre-commit: ${message}\n`);
  process.exit(1);
}

// 1. Identity: this repo is public, so never commit with a personal email
for (const [role, variable] of [['author', 'GIT_AUTHOR_IDENT'], ['committer', 'GIT_COMMITTER_IDENT']]) {
  const ident = spawnSync('git', ['var', variable], { cwd: root, encoding: 'utf8' }).stdout.trim();
  const problem = identityProblem(role, ident);
  if (problem) fail(problem);
}

// 2. Lint and tests
if (!existsSync(resolve(root, 'node_modules'))) {
  fail('dependencies are not installed. Run `npm install`.');
}
for (const script of ['lint', 'test']) {
  console.log(`pre-commit: npm run ${script}`);
  // One fixed command string (not an argument list): npm is a .cmd file on Windows, which needs a shell
  const result = spawnSync(`npm run ${script} --silent`, { cwd: root, stdio: 'inherit', shell: true });
  if (result.status !== 0) fail(`\`npm run ${script}\` failed. Fix the problems above, or use --no-verify to skip.`);
}
