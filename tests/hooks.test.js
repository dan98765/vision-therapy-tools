import { existsSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { commitMessageProblem, commitProblems, emailOf, identityProblem } from '../scripts/hooks/checks.js';

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
  const hooks = ['pre-commit', 'commit-msg'];
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
