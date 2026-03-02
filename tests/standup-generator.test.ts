import { describe, it, expect, vi } from 'vitest';
import { formatMultiRepoStandup, type MultiRepoStandup } from '../standup/standup-generator.js';

const mockStandup: MultiRepoStandup = {
  date: '2025-03-01',
  repos: [
    {
      repoName: 'AiraBot',
      commits: ['feat: add smart clipboard', 'fix: correct IST timezone'],
      commitCount: 2,
    },
    {
      repoName: 'MyApp',
      commits: ['chore: update deps'],
      commitCount: 1,
    },
  ],
  totalCommits: 3,
};

describe('formatMultiRepoStandup', () => {
  it('plain format contains repo names', () => {
    const out = formatMultiRepoStandup(mockStandup, 'plain');
    expect(out).toContain('AiraBot');
    expect(out).toContain('MyApp');
  });

  it('plain format contains commit messages', () => {
    const out = formatMultiRepoStandup(mockStandup, 'plain');
    expect(out).toContain('add smart clipboard');
  });

  it('slack format uses bold markdown', () => {
    const out = formatMultiRepoStandup(mockStandup, 'slack');
    expect(out).toContain('*');
  });

  it('discord format uses double-star bold', () => {
    const out = formatMultiRepoStandup(mockStandup, 'discord');
    expect(out).toContain('**');
  });

  it('includes total commit count', () => {
    const out = formatMultiRepoStandup(mockStandup, 'plain');
    expect(out).toContain('3');
  });

  it('handles empty repos gracefully', () => {
    const empty: MultiRepoStandup = { date: '2025-03-01', repos: [], totalCommits: 0 };
    const out = formatMultiRepoStandup(empty, 'plain');
    expect(out).toBeTruthy();
    expect(out).toContain('No commits');
  });
});
