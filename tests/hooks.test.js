import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  addedLines,
  commitMessageProblem,
  commitProblems,
  contentProblems,
  emailOf,
  identityProblem,
} from '../scripts/hooks/checks.js';

const root = resolve(import.meta.dirname, '..');

describe('commitMessageProblem', () => {
  it.each([
    'feat: add a thing',
    'fix(hart-chart): stop repeating letters',
    'chore(deps): bump vite from 8.3.3 to 8.4.0',
    'feat!: drop file:// support',
    'docs(readme)!: rewrite',
    'Merge branch "main" into feature',
    'Revert "feat: add a thing"',
    'fixup! feat: add a thing',
    'feat: subject\n\nA longer body\nwith several lines.',
    '# a comment first\nfeat: subject after a comment',
  ])('accepts %j', message => {
    expect(commitMessageProblem(message)).toBeNull();
  });

  it.each([
    'update stuff',
    'Feat: capital type',
    'feat:no space after the colon',
    'feat(): empty scope',
    'feature: not a known type',
    'feat: ',
    '',
    '# only a comment',
  ])('rejects %j', message => {
    expect(commitMessageProblem(message)).toBeTypeOf('string');
  });

  it('tells the user what to do', () => {
    expect(commitMessageProblem('nope')).toMatch(/Conventional Commits/);
  });
});

describe('identity check', () => {
  it('reads the email out of a git identity', () => {
    expect(emailOf('Some Name <a@b.example> 1700000000 +0000')).toBe('a@b.example');
    expect(emailOf('no email here')).toBe('');
  });

  it('accepts only the GitHub noreply address', () => {
    expect(identityProblem('author', 'A <123+user@users.noreply.github.com> 1 +0000')).toBeNull();
    expect(identityProblem('author', 'A <me@example.com> 1 +0000')).toMatch(/would become public/);
    expect(identityProblem('committer', 'A <> 1 +0000')).toMatch(/\(none\)/);
  });
});

describe('hook wiring', () => {
  const hooks = ['pre-commit', 'commit-msg', 'pre-push'];
  const packageJson = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));

  it.each(hooks)('husky runs the %s script, which exists', hook => {
    const text = readFileSync(join(root, '.husky', hook), 'utf8');
    expect(text).toContain(`node scripts/hooks/${hook}.js`);
    expect(existsSync(join(root, 'scripts', 'hooks', `${hook}.js`))).toBe(true);
  });

  it('npm install enables the hooks through husky', () => {
    expect(packageJson.scripts.prepare).toBe('husky');
    expect(packageJson.devDependencies.husky).toBeDefined();
  });
});

describe('commitProblems (the CI backstop)', () => {
  const owner = 'someowner';
  const good = {
    message: 'feat: add a thing',
    authorLogin: owner,
    authorEmail: '1+someowner@users.noreply.github.com',
    committerLogin: owner,
    committerEmail: '1+someowner@users.noreply.github.com',
  };

  it('passes a conventional commit made with a noreply email', () => {
    expect(commitProblems(good, owner)).toEqual([]);
  });

  it('flags a non-conventional message from anyone', () => {
    expect(commitProblems({ ...good, message: 'stuff', authorLogin: 'contributor', committerLogin: 'contributor' }, owner)).toHaveLength(1);
  });

  it('flags the owner using a personal author or committer email', () => {
    expect(commitProblems({ ...good, authorEmail: 'me@example.com' }, owner)[0]).toMatch(/author email/);
    expect(commitProblems({ ...good, committerEmail: 'me@example.com' }, owner)[0]).toMatch(/committer email/);
  });

  it('does not check the email addresses of other people', () => {
    const contributor = { ...good, authorLogin: 'contributor', authorEmail: 'them@example.org', committerLogin: 'web-flow', committerEmail: 'noreply@github.com' };
    expect(commitProblems(contributor, owner)).toEqual([]);
  });

  it('reports every problem on a commit', () => {
    expect(commitProblems({ ...good, message: 'stuff', authorEmail: 'me@example.com' }, owner)).toHaveLength(2);
  });
});

describe('Node versions', () => {
  it('CI tests both declared minimums', () => {
    const { engines } = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));
    const ci = readFileSync(join(root, '.github', 'workflows', 'ci.yml'), 'utf8');
    for (const minimum of engines.node.match(/\d+\.\d+\.\d+/g)) expect(ci).toContain(`'${minimum}'`);
  });
});

// Fixtures are put together from pieces so this file does not contain what the scan looks for.
describe('addedLines', () => {
  const diff = [
    'diff --git a/docs/a.md b/docs/a.md',
    'index 111..222 100644',
    '--- a/docs/a.md',
    '+++ b/docs/a.md',
    '@@ -3,0 +4,2 @@ heading',
    '+first added',
    '+++ not a header',
    '@@ -9 +11 @@',
    '-old',
    '+changed',
    'diff --git a/gone.txt b/gone.txt',
    '--- a/gone.txt',
    '+++ /dev/null',
    '@@ -1 +0,0 @@',
    '-removed',
  ].join('\n');

  it('returns the added lines with their numbers, and skips removed files and removed lines', () => {
    expect(addedLines(diff)).toEqual([
      {
        path: 'docs/a.md',
        lines: [
          { number: 4, text: 'first added' },
          { number: 5, text: '++ not a header' },
          { number: 11, text: 'changed' },
        ],
      },
    ]);
  });

  it('is empty for an empty diff', () => {
    expect(addedLines('')).toEqual([]);
  });
});

describe('contentProblems', () => {
  const check = (text, path = 'docs/a.md') => contentProblems([{ path, lines: [{ number: 7, text }] }]);

  it('passes ordinary text, noreply and example addresses, and relative paths', () => {
    expect(check('Use the 1234+name@users.noreply.github.com address, or me@example.com.')).toEqual([]);
    expect(check('Open ../shared/page.js and docs/tool-ideas.md')).toEqual([]);
    expect(check('The path /usr/local/bin and C:/ are not personal.')).toEqual([]);
  });

  it('flags a path on a personal computer', () => {
    const windows = ['C:', 'Users', 'someone', 'dev'].join('\\');
    expect(check(`cd ${windows}`)[0]).toMatch(/docs\/a\.md:7 adds an absolute path/);
    expect(check('see ' + ['', 'Users', 'someone', 'dev'].join('/') + '/')).toHaveLength(1);
    expect(check('see ' + ['', 'home', 'someone', 'dev'].join('/') + '/')).toHaveLength(1);
  });

  it('flags a personal email address', () => {
    expect(check('mail ' + ['someone', 'gmail.com'].join('@'))[0]).toMatch(/email address/);
  });

  it('flags access tokens and private keys without printing them', () => {
    const token = 'ghp_' + 'a1B2'.repeat(9);
    const problems = check(`token = ${token}`);
    expect(problems).toHaveLength(1);
    expect(problems[0]).not.toContain(token);
    expect(check('AKIA' + 'ABCDEFGHIJKLMNOP')).toHaveLength(1);
    expect(check('-----BEGIN ' + 'RSA PRIVATE KEY-----')).toHaveLength(1);
  });

  it('flags merge conflict markers', () => {
    expect(check('<'.repeat(7) + ' HEAD')[0]).toMatch(/merge conflict/);
    expect(check('>'.repeat(7) + ' branch')).toHaveLength(1);
    expect(check('a line with ' + '<'.repeat(7) + ' in the middle')).toEqual([]);
  });

  it('skips the generated lock file', () => {
    expect(check('mail ' + ['someone', 'gmail.com'].join('@'), 'package-lock.json')).toEqual([]);
  });

  it('is clean for the files in this repo', () => {
    const tracked = readdirSync(root, { recursive: true, withFileTypes: false })
      .map(String)
      .filter(path => /\.(md|js|css|html|json|yml|yaml)$/.test(path))
      .filter(path => !/^(node_modules|dist|\.git)[\\/]/.test(path));
    const files = tracked.map(path => ({
      path,
      lines: readFileSync(join(root, path), 'utf8').split('\n').map((text, i) => ({ number: i + 1, text })),
    }));
    expect(contentProblems(files)).toEqual([]);
  });
});
