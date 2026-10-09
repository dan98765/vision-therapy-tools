// commit-msg: require Conventional Commits. git passes the path of the message file.

import { readFileSync } from 'node:fs';
import { commitMessageProblem } from './checks.js';

const problem = commitMessageProblem(readFileSync(process.argv[2], 'utf8'));
if (problem) {
  console.error(`\ncommit-msg: ${problem}\n`);
  process.exit(1);
}
