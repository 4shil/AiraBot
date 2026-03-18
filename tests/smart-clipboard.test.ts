import { describe, it, expect, beforeEach } from 'vitest';
import { SmartClipboard } from '../clipboard/smart-clipboard.js';

describe('SmartClipboard', () => {
  let cb: SmartClipboard;

  beforeEach(() => {
    cb = new SmartClipboard('/tmp/airabot-test');
  });

  it('adds an entry', () => {
    cb.add('hello world');
    const items = cb.list();
    expect(items.length).toBeGreaterThan(0);
    expect(items[0]!.content).toBe('hello world');
  });

  it('deduplicates identical entries', () => {
    cb.add('duplicate me');
    cb.add('duplicate me');
    const items = cb.list().filter((i) => i.content === 'duplicate me');
    expect(items.length).toBe(1);
  });

  it('searches by keyword', () => {
    cb.add('typescript is great for large projects');
    cb.add('python is good for scripting');
    const results = cb.search('typescript');
    expect(results.length).toBeGreaterThan(0);
    expect(results[0]!.entry.content).toContain('typescript');
  });

  it('clears all entries', () => {
    cb.add('item 1');
    cb.add('item 2');
    cb.clear();
    expect(cb.list().length).toBe(0);
  });

  it('categorizes code correctly', () => {
    cb.add('const x = require("foo"); function bar() {}');
    const items = cb.list();
    const item = items.find((i) => i.content.includes('require'));
    expect(item?.category).toBe('code');
  });

  it('categorizes links correctly', () => {
    cb.add('https://github.com/4shil/AiraBot');
    const items = cb.list();
    const item = items.find((i) => i.content.includes('github.com'));
    expect(item?.category).toBe('link');
  });
});
