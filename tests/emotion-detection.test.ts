import { describe, it, expect } from 'vitest';
import { detectUserEmotionRegex } from '../personality/emotion-detection.js';

describe('emotion detection (regex)', () => {
  it('detects frustrated from error keyword', () => {
    const result = detectUserEmotionRegex('This error is killing me!');
    expect(result.detected).toContain('frustrated');
  });

  it('detects excited from exclamation + positive word', () => {
    const result = detectUserEmotionRegex('Awesome! It worked!');
    expect(result.detected).toContain('excited');
  });

  it('detects concerned from help keyword', () => {
    const result = detectUserEmotionRegex('I need help, this is urgent');
    expect(result.detected).toContain('concerned');
  });

  it('detects tired from exhausted keyword', () => {
    const result = detectUserEmotionRegex('I am exhausted after this long day');
    expect(result.detected).toContain('tired');
  });

  it('detects curious from question mark', () => {
    const result = detectUserEmotionRegex('How does this work?');
    expect(result.detected).toContain('curious');
  });

  it('detects playful from lol', () => {
    const result = detectUserEmotionRegex('lol that was funny');
    expect(result.detected).toContain('playful');
  });

  it('detects playful from machane', () => {
    const result = detectUserEmotionRegex('Machane, entha samsaram?');
    expect(result.detected).toContain('playful');
  });

  it('returns low confidence for neutral message', () => {
    const result = detectUserEmotionRegex('The build finished.');
    expect(result.confidence).toBeLessThan(60);
  });

  it('handles empty string without throwing', () => {
    const result = detectUserEmotionRegex('');
    expect(result.detected).toBeDefined();
  });

  it('detects multiple emotions in complex message', () => {
    const result = detectUserEmotionRegex('Awesome! But why is this broken?');
    expect(result.detected.length).toBeGreaterThan(1);
  });
});
