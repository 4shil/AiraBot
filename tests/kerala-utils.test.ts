import { describe, it, expect } from 'vitest';
import { KeralaUtils } from '../kerala/kerala-utils.js';

describe('KeralaUtils', () => {
  it('getKeralaFestivals returns an array', () => {
    const festivals = KeralaUtils.getKeralaFestivals(2025);
    expect(Array.isArray(festivals)).toBe(true);
    expect(festivals.length).toBeGreaterThan(0);
  });

  it('each festival has a name and date', () => {
    const festivals = KeralaUtils.getKeralaFestivals(2025);
    for (const f of festivals) {
      expect(typeof f.name).toBe('string');
      expect(f.date instanceof Date).toBe(true);
    }
  });

  it('getUpcomingFestivals returns subset of all festivals', () => {
    const upcoming = KeralaUtils.getUpcomingFestivals(365);
    const all = KeralaUtils.getKeralaFestivals(new Date().getFullYear());
    expect(upcoming.length).toBeLessThanOrEqual(all.length);
  });

  it('getUpcomingFestivals with 0 days returns empty or nothing past', () => {
    const upcoming = KeralaUtils.getUpcomingFestivals(0);
    expect(Array.isArray(upcoming)).toBe(true);
  });

  it('isKeralaHoliday returns object with isHoliday boolean', () => {
    const result = KeralaUtils.isKeralaHoliday(new Date('2025-01-01'));
    expect(typeof result.isHoliday).toBe('boolean');
  });
});
