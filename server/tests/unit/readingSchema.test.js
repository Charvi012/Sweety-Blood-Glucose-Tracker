import { describe, it, expect } from 'vitest';
import { buildReadingSchema, MESSAGES } from '../../src/modules/readings/schemas.js';

const TODAY = '2025-10-15';
const schema = buildReadingSchema(() => TODAY);
const valid = { date: '2025-10-15', slot: 'after_lunch', value: 120 };

const firstError = (input) => {
  const result = schema.safeParse(input);
  expect(result.success).toBe(false);
  return result.error.issues[0].message;
};

describe('reading schema', () => {
  it('accepts a valid reading, including today and the boundary values', () => {
    expect(schema.safeParse(valid).success).toBe(true);
    expect(schema.safeParse({ ...valid, value: 40 }).success).toBe(true);
    expect(schema.safeParse({ ...valid, value: 600 }).success).toBe(true);
  });

  describe('value', () => {
    it.each([undefined, null, ''])('is required (%s)', (value) => {
      expect(firstError({ ...valid, value })).toBe(MESSAGES.valueRequired);
    });

    it.each([39, 601, 0, -5, 120.5, '120', 'abc', true])('rejects %j', (value) => {
      expect(firstError({ ...valid, value })).toBe(MESSAGES.valueRange);
    });
  });

  describe('date', () => {
    it('rejects a future date', () => {
      expect(firstError({ ...valid, date: '2025-10-16' })).toBe(MESSAGES.dateFuture);
    });
    it('rejects an impossible date', () => {
      expect(firstError({ ...valid, date: '2025-02-30' })).toBe(MESSAGES.dateInvalid);
    });
    it('rejects a missing date', () => {
      expect(firstError({ slot: 'after_lunch', value: 100 })).toBe(MESSAGES.dateRequired);
    });
  });

  describe('slot', () => {
    it('rejects an unknown slot', () => {
      expect(firstError({ ...valid, slot: 'midnight' })).toBe(MESSAGES.slotInvalid);
    });
    it('rejects a missing slot', () => {
      expect(firstError({ date: valid.date, value: 100 })).toBe(MESSAGES.slotInvalid);
    });
  });

  it('ignores unknown properties such as user_id', () => {
    const result = schema.parse({ ...valid, user_id: 'someone-else' });
    expect(result).toEqual(valid);
  });
});
