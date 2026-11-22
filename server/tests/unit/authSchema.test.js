import { describe, it, expect } from 'vitest';
import { loginSchema, registerSchema } from '../../src/modules/auth/schemas.js';

const valid = { name: 'Asha', email: 'Asha@Example.com ', password: 'Passw0rd!x' };

describe('registerSchema', () => {
  it('trims and lowercases the email', () => {
    expect(registerSchema.parse(valid).email).toBe('asha@example.com');
  });

  it.each([
    [{ ...valid, name: '  ' }, 'Please enter your name.'],
    [{ ...valid, email: 'not-an-email' }, 'Please enter a valid email address.'],
    [{ ...valid, password: 'short1' }, 'Password must be at least 8 characters.'],
    [{ ...valid, password: 'onlyletters' }, 'Password must include at least one letter and one number.'],
    [{ ...valid, password: 'a1'.repeat(40) }, 'Password must be at most 72 bytes.'],
  ])('rejects %j', (input, message) => {
    const result = registerSchema.safeParse(input);
    expect(result.success).toBe(false);
    expect(result.error.issues[0].message).toBe(message);
  });
});

describe('loginSchema', () => {
  it('does not enforce password complexity', () => {
    expect(loginSchema.safeParse({ email: 'a@b.co', password: 'x' }).success).toBe(true);
  });
  it('requires a password', () => {
    expect(loginSchema.safeParse({ email: 'a@b.co', password: '' }).success).toBe(false);
  });
});
