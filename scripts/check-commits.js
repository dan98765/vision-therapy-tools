// CI backstop for the local git hooks, which anyone can skip with --no-verify.
// On a pull request it checks the PR title and every commit in the PR; on a push to main it checks
// the pushed commits. Rules live in scripts/hooks/checks.js. Reads the GitHub Actions environment;
// it is not meant to be run by hand.

import { readFileSync } from 'node:fs';
import { commitMessageProblem, commitProblems } from './hooks/checks.js';

const { GITHUB_EVENT_NAME: eventName, GITHUB_EVENT_PATH: eventPath, GITHUB_REPOSITORY: repository, GITHUB_TOKEN: token } = process.env;
if (!eventName || !eventPath || !repository || !token) {
  console.error('check-commits: run this from GitHub Actions (GITHUB_EVENT_NAME, GITHUB_EVENT_PATH, GITHUB_REPOSITORY and GITHUB_TOKEN are required).');
  process.exit(2); // nothing is pending yet, so exiting straight away is safe
}

const event = JSON.parse(readFileSync(eventPath, 'utf8'));
const owner = repository.split('/')[0];

async function api(path) {
  const response = await fetch(`https://api.github.com/repos/${repository}/${path}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
    },
  });
  if (!response.ok) throw new Error(`GitHub API ${path} returned ${response.status}`);
  return response.json();
}

const simplify = c => ({
  sha: c.sha.slice(0, 7),
  message: c.commit.message,
  authorLogin: c.author?.login,
  authorEmail: c.commit.author.email,
  committerLogin: c.committer?.login,
  committerEmail: c.commit.committer.email,
});

async function commitsToCheck() {
  const [base, head] = eventName === 'pull_request'
    ? [event.pull_request.base.sha, event.pull_request.head.sha]
    : [event.before, event.after];
  const isNewBranch = /^0+$/.test(base);
  if (!isNewBranch) {
    try {
      return (await api(`compare/${base}...${head}`)).commits.map(simplify);
    } catch (error) {
      console.warn(`${error.message}; checking only the newest commit.`); // for example after a force-push
    }
  }
  return [simplify(await api(`commits/${head}`))];
}

const failures = [];

if (eventName === 'pull_request') {
  const problem = commitMessageProblem(event.pull_request.title);
  if (problem) failures.push(['pull request title', problem]);
}

const commits = await commitsToCheck();
for (const commit of commits) {
  for (const problem of commitProblems(commit, owner)) failures.push([`commit ${commit.sha}`, problem]);
}

for (const [where, problem] of failures) {
  console.error(`::error title=${where}::${problem.replaceAll('\n', ' ')}`);
  console.error(`${where}: ${problem}\n`);
}
console.log(failures.length ? `${failures.length} problem(s)` : `${commits.length} commit(s) checked, no problems`);
// Set the exit code and let the process end by itself: calling process.exit() while fetch connections
// are still closing crashes Node on Windows.
process.exitCode = failures.length ? 1 : 0;
