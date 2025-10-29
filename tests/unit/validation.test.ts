import { isValidEmail, isPositiveNumber } from '../../src/utils/validation';

describe('Validation Utils', () => {
  describe('isValidEmail', () => {
    it('should return true for a valid email', () => {
      expect(isValidEmail('test@example.com')).toBe(true);
    });

    it('should return false for an invalid email without domain', () => {
      expect(isValidEmail('invalid-email')).toBe(false);
    });

    it('should return false for an invalid email with space', () => {
      expect(isValidEmail('test @example.com')).toBe(false);
    });

    it('should return false for an empty string', () => {
      expect(isValidEmail('')).toBe(false);
    });

    it('should return true for valid email with multiple subdomains', () => {
      expect(isValidEmail('user@mail.example.co.uk')).toBe(true);
    });
  });

  describe('isPositiveNumber', () => {
    it('should return true for a positive number', () => {
      expect(isPositiveNumber(10)).toBe(true);
    });

    it('should return false for a negative number', () => {
      expect(isPositiveNumber(-5)).toBe(false);
    });

    it('should return false for zero', () => {
      expect(isPositiveNumber(0)).toBe(false);
    });

    it('should return true for a small positive number', () => {
      expect(isPositiveNumber(0.1)).toBe(true);
    });
  });
});
