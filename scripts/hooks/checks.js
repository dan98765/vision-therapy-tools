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

// ── Content of the lines being added ─────────────────────
// This repo is public and history is permanent, so a commit must not add personal details, secrets or
// leftover merge markers. Only the lines a commit adds are checked, not what is already there.

// Files whose text is not written by hand
export const SCAN_SKIP = ['package-lock.json'];

// An email address that is fine to publish: GitHub's noreply forms, or an example domain
const SAFE_EMAIL = /^noreply@github\.com$|@(users\.noreply\.github\.com|(?:[\w-]+\.)*example(?:\.(?:com|org|net))?|(?:[\w-]+\.)*test|localhost)$/i;

const EMAIL = /[\w.+-]+@[\w-]+(?:\.[\w-]+)+/g;

const LINE_RULES = [
  { name: 'an absolute path on a personal computer', test: line => /[A-Za-z]:\\Users\\[^\\\s"'`]+|\/Users\/[A-Za-z][\w.-]*\/|\/home\/[A-Za-z][\w.-]*\//.test(line) },
  { name: 'an email address that is not a noreply or example address', test: line => (line.match(EMAIL) ?? []).some(email => !SAFE_EMAIL.test(email)) },
  { name: 'something that looks like an access token or key', test: line => /\b(?:ghp|gho|ghu|ghs|ghr)_[A-Za-z0-9]{30,}|github_pat_[A-Za-z0-9_]{30,}|\bAKIA[0-9A-Z]{16}\b|xox[abprs]-[A-Za-z0-9-]{10,}|\bsk-[A-Za-z0-9]{20,}|-----BEGIN (?:[A-Z]+ )?PRIVATE KEY-----/.test(line) },
  { name: 'a merge conflict marker', test: line => /^(?:<{7}|>{7})(?: |$)/.test(line) },
];

// Reads `git diff --cached --unified=0` and returns [{ path, lines: [{ number, text }] }] for the added lines.
export function addedLines(diff) {
  const files = [];
  let file = null;
  let inHeader = false; // between "diff --git" and the first "@@", where "+++ path" names the file
  let number = 0;
  for (const line of diff.split(/\r?\n/)) {
    if (line.startsWith('diff ')) {
      inHeader = true;
      file = null;
    } else if (inHeader && line.startsWith('+++ ')) {
      const path = line.slice(4).replace(/^b\//, '');
      file = path === '/dev/null' ? null : { path, lines: [] };
      if (file) files.push(file);
    } else if (line.startsWith('@@')) {
      inHeader = false;
      number = Number(line.match(/\+(\d+)/)?.[1] ?? 0);
    } else if (!inHeader && file && line.startsWith('+')) {
      file.lines.push({ number, text: line.slice(1) });
      number++;
    }
  }
  return files;
}

// Problems in the added lines, as text. The line itself is not repeated, since it may be the secret.
export function contentProblems(files) {
  const problems = [];
  for (const { path, lines } of files) {
    if (SCAN_SKIP.includes(path)) continue;
    for (const { number, text } of lines) {
      for (const rule of LINE_RULES) {
        if (rule.test(text)) problems.push(`${path}:${number} adds ${rule.name}.`);
      }
    }
  }
  return problems;
}
