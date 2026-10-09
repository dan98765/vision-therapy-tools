import { existsSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { commitMessageProblem, emailOf, identityProblem } from '../scripts/hooks/checks.js';

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
