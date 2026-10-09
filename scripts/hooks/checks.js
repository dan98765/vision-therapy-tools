// The rules the git hooks enforce, kept free of git and file access so they can be tested.

const TYPES = ['feat', 'fix', 'docs', 'style', 'refactor', 'perf', 'test', 'build', 'ci', 'chore', 'revert'];

// type(scope)!: subject, with an optional scope and an optional ! for breaking changes
const CONVENTIONAL = new RegExp(`^(${TYPES.join('|')})(\\([a-z0-9._/-]+\\))?!?: \\S.*`);

// Messages git writes itself, which are not expected to follow the style
const GENERATED = /^(Merge |Revert "|fixup! |squash! |amend! )/;

// Returns a problem description, or null when the message is fine.
export function commitMessageProblem(message) {
  const subject = message
    .split('\n')
    .find(line => line.trim() !== '' && !line.startsWith('#'));
  if (!subject) return 'The commit message is empty.';
  if (GENERATED.test(subject) || CONVENTIONAL.test(subject)) return null;
  return (
    `"${subject}" does not follow Conventional Commits.\n` +
    `Use "type(scope): summary" or "type: summary", where type is one of: ${TYPES.join(', ')}.\n` +
    'Example: feat(hart-chart): add row numbers'
  );
}

export const NOREPLY = /@users\.noreply\.github\.com$/;

// `ident` is the output of `git var GIT_AUTHOR_IDENT`: "Name <email> timestamp timezone".
export function emailOf(ident) {
  return ident.match(/<([^>]*)>/)?.[1] ?? '';
}

// This repo is public and history is permanent, so only the GitHub noreply address may be used.
export function identityProblem(role, ident) {
  const email = emailOf(ident);
  if (NOREPLY.test(email)) return null;
  return (
    `The ${role} email is "${email || '(none)'}", which would become public.\n` +
    'Use your GitHub noreply address for this repo, for example:\n' +
    '  git config user.email "<id>+<username>@users.noreply.github.com"'
  );
}

// Rules for one commit as seen by CI, which has no local git config. `commit` is reduced to what the
// rules need: { message, authorLogin, authorEmail, committerLogin, committerEmail }.
// The email rule applies only to commits made by the repo owner (a contributor's email is theirs to
// choose); the message rule applies to every commit.
export function commitProblems(commit, owner) {
  const problems = [];
  const message = commitMessageProblem(commit.message);
  if (message) problems.push(message);
  if (commit.authorLogin === owner) {
    const problem = identityProblem('author', `<${commit.authorEmail}>`);
    if (problem) problems.push(problem);
  }
  if (commit.committerLogin === owner) {
    const problem = identityProblem('committer', `<${commit.committerEmail}>`);
    if (problem) problems.push(problem);
  }
  return problems;
}
