#!/usr/bin/env node
/**
 * Publish dist/ to the gh-pages branch.
 *
 * Uses a detached worktree rather than force-pushing the working tree, so a
 * failed deploy cannot leave the checkout in a strange state. The branch keeps
 * its history, so a bad deploy can be reverted like any other commit.
 */
import { execFileSync } from 'node:child_process';
import { existsSync, rmSync, mkdirSync, cpSync, writeFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';

const BRANCH = 'gh-pages';
const DIST = resolve('dist');
const WORKTREE = resolve('.deploy');

const git = (...args) =>
  execFileSync('git', args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();

const gitLoud = (...args) =>
  execFileSync('git', args, { stdio: 'inherit' });

/**
 * Refuse to publish without a configured committer.
 *
 * An earlier version invented a placeholder identity so a machine with no git
 * config could still deploy. That was the wrong trade: it silently attributed
 * commits to somebody who does not exist. Failing here costs one command and
 * keeps the history honest.
 */
function requireIdentity() {
  const read = (key) => {
    try {
      return git('config', key);
    } catch {
      return '';
    }
  };
  if (read('user.name') && read('user.email')) return;

  console.error('No git identity is configured for this repository.');
  console.error('Set one first, for example:');
  console.error('  git config-home     # napalm255 <napalm255@gmail.com>');
  console.error('  git config-work');
  console.error('or set user.name and user.email directly.');
  process.exit(1);
}

function main() {
  if (!existsSync(DIST) || readdirSync(DIST).length === 0) {
    console.error('dist/ is empty. Run "npm run build" first.');
    process.exit(1);
  }

  requireIdentity();

  const sha = git('rev-parse', '--short', 'HEAD');
  const branch = git('rev-parse', '--abbrev-ref', 'HEAD');

  // A stale worktree from an interrupted run would block the checkout.
  if (existsSync(WORKTREE)) {
    try {
      gitLoud('worktree', 'remove', '--force', WORKTREE);
    } catch {
      rmSync(WORKTREE, { recursive: true, force: true });
    }
  }
  try {
    git('worktree', 'prune');
  } catch {
    /* nothing to prune */
  }

  const remoteHasBranch = (() => {
    try {
      return git('ls-remote', '--heads', 'origin', BRANCH).length > 0;
    } catch {
      return false;
    }
  })();

  if (remoteHasBranch) {
    gitLoud('fetch', 'origin', `${BRANCH}:${BRANCH}`, '--force');
    gitLoud('worktree', 'add', WORKTREE, BRANCH);
  } else {
    mkdirSync(WORKTREE, { recursive: true });
    gitLoud('worktree', 'add', '--detach', WORKTREE);
    execFileSync('git', ['checkout', '--orphan', BRANCH], { cwd: WORKTREE, stdio: 'inherit' });
    execFileSync('git', ['rm', '-rf', '--quiet', '.'], { cwd: WORKTREE, stdio: 'inherit' });
  }

  // Replace the published tree wholesale, keeping git metadata.
  for (const entry of readdirSync(WORKTREE)) {
    if (entry === '.git') continue;
    rmSync(resolve(WORKTREE, entry), { recursive: true, force: true });
  }
  cpSync(DIST, WORKTREE, { recursive: true });

  // Pages runs Jekyll by default, which would drop files beginning with _.
  writeFileSync(resolve(WORKTREE, '.nojekyll'), '');

  execFileSync('git', ['add', '--all'], { cwd: WORKTREE, stdio: 'inherit' });
  const dirty = execFileSync('git', ['status', '--porcelain'], {
    cwd: WORKTREE,
    encoding: 'utf8',
  }).trim();

  if (!dirty) {
    console.log('gh-pages is already up to date.');
  } else {
    execFileSync(
      'git',
      ['commit', '-m', `deploy: build from ${branch} at ${sha}`],
      { cwd: WORKTREE, stdio: 'inherit' },
    );
    execFileSync('git', ['push', 'origin', BRANCH], { cwd: WORKTREE, stdio: 'inherit' });
    console.log(`Published ${sha} to ${BRANCH}.`);
  }

  gitLoud('worktree', 'remove', '--force', WORKTREE);
}

main();
