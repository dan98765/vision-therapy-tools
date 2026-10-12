// pre-push: lint, test and build once more before anything leaves this computer. This catches commits
// made with `git commit --no-verify`, and a build that fails even though lint and the tests pass.
// Skip in an emergency with `git push --no-verify` (CI runs the same checks).

import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..', '..');

if (!existsSync(resolve(root, 'node_modules'))) {
  console.error('\npre-push: dependencies are not installed. Run `npm install`.\n');
  process.exit(1);
}
for (const script of ['lint', 'test', 'build']) {
  console.log(`pre-push: npm run ${script}`);
  // One fixed command string: npm is a .cmd file on Windows, which needs a shell
  const result = spawnSync(`npm run ${script} --silent`, { cwd: root, stdio: 'inherit', shell: true });
  if (result.status !== 0) {
    console.error(`\npre-push: \`npm run ${script}\` failed. Fix the problems above, or use --no-verify to skip.\n`);
    process.exit(1);
  }
}
