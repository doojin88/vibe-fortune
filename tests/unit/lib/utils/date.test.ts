import { formatDate, formatDateTime, formatBirthDate } from '../../../../src/lib/utils/date';

describe('Date Utils', () => {
  describe('formatDate', () => {
    it('should format ISO date string with default Korean pattern', () => {
      const result = formatDate('2024-10-30');
      expect(result).toBe('2024년 10월 30일');
    });

    it('should format Date object with default Korean pattern', () => {
      const date = new Date('2024-10-30');
      const result = formatDate(date);
      expect(result).toMatch(/2024년 10월 30일/);
    });

    it('should format date with custom pattern', () => {
      const result = formatDate('2024-10-30', 'yyyy-MM-dd');
      expect(result).toBe('2024-10-30');
    });

    it('should handle ISO string with time component', () => {
      const result = formatDate('2024-10-30T14:30:00Z');
      expect(result).toBe('2024년 10월 30일');
    });

    it('should handle different custom patterns', () => {
      const result = formatDate('2024-10-30', 'dd.MM.yyyy');
      expect(result).toBe('30.10.2024');
    });

    it('should format month only pattern', () => {
      const result = formatDate('2024-10-30', 'MM월');
      expect(result).toBe('10월');
    });

    it('should format year only pattern', () => {
      const result = formatDate('2024-10-30', 'yyyy');
      expect(result).toBe('2024');
    });

    it('should handle first day of month', () => {
      const result = formatDate('2024-10-01');
      expect(result).toBe('2024년 10월 01일');
    });

    it('should handle last day of month', () => {
      const result = formatDate('2024-10-31');
      expect(result).toBe('2024년 10월 31일');
    });

    it('should handle leap year date', () => {
      const result = formatDate('2024-02-29');
      expect(result).toBe('2024년 02월 29일');
    });

    it('should handle year 1900', () => {
      const result = formatDate('1900-01-01');
      expect(result).toBe('1900년 01월 01일');
    });

    it('should return Korean locale formatted string', () => {
      const result = formatDate('2024-10-30');
      // Verify it contains Korean characters for year, month, day
      expect(result).toMatch(/년/);
      expect(result).toMatch(/월/);
      expect(result).toMatch(/일/);
    });
  });

  describe('formatDateTime', () => {
    it('should format ISO datetime string with Korean pattern including time', () => {
      const result = formatDateTime('2024-10-30T14:30:00');
      expect(result).toMatch(/2024년 10월 30일 14:30/);
    });

    it('should format Date object with time', () => {
      const date = new Date('2024-10-30T14:30:00');
      const result = formatDateTime(date);
      expect(result).toMatch(/2024년 10월 30일 14:30/);
    });

    it('should format time in 24-hour format', () => {
      const result = formatDateTime('2024-10-30T23:59:59');
      expect(result).toMatch(/23:59/);
    });

    it('should format early morning time', () => {
      const result = formatDateTime('2024-10-30T00:00:00');
      expect(result).toMatch(/00:00/);
    });

    it('should include Korean characters', () => {
      const result = formatDateTime('2024-10-30T14:30:00');
      expect(result).toMatch(/년/);
      expect(result).toMatch(/월/);
      expect(result).toMatch(/일/);
    });

    it('should format afternoon time', () => {
      const result = formatDateTime('2024-10-30T15:45:00');
      expect(result).toMatch(/15:45/);
    });

    it('should handle single digit minutes', () => {
      const result = formatDateTime('2024-10-30T10:05:00');
      expect(result).toMatch(/10:05/);
    });

    it('should handle single digit hours', () => {
      const result = formatDateTime('2024-10-30T09:30:00');
      expect(result).toMatch(/09:30/);
    });

    it('should maintain consistent format across different dates', () => {
      const result1 = formatDateTime('2024-01-01T00:00:00');
      const result2 = formatDateTime('2024-12-31T23:59:00');
      // Both should have the same pattern structure
      expect(result1).toMatch(/년.*월.*일.*:/);
      expect(result2).toMatch(/년.*월.*일.*:/);
    });
  });

  describe('formatBirthDate', () => {
    it('should format ISO date string in YYYY-MM-DD format', () => {
      const result = formatBirthDate('2000-01-01');
      expect(result).toBe('2000-01-01');
    });

    it('should format with leading zeros for month', () => {
      const result = formatBirthDate('2024-03-05');
      expect(result).toBe('2024-03-05');
    });

    it('should format with leading zeros for day', () => {
      const result = formatBirthDate('2024-10-09');
      expect(result).toBe('2024-10-09');
    });

    it('should maintain consistent format', () => {
      const result = formatBirthDate('1990-05-15');
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });

    it('should handle year 1900', () => {
      const result = formatBirthDate('1900-01-01');
      expect(result).toBe('1900-01-01');
    });

    it('should handle early 20th century dates', () => {
      const result = formatBirthDate('1920-06-30');
      expect(result).toBe('1920-06-30');
    });

    it('should handle recent dates', () => {
      const result = formatBirthDate('2024-10-30');
      expect(result).toBe('2024-10-30');
    });

    it('should be suitable for HTML input[type="date"] value', () => {
      const result = formatBirthDate('2000-05-15');
      // HTML date input expects YYYY-MM-DD format
      expect(result).toBe('2000-05-15');
      // Verify it's a valid format for HTML input
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });
  });

  describe('Date edge cases', () => {
    it('should handle leap year February 29', () => {
      const result = formatDate('2020-02-29');
      expect(result).toBe('2020년 02월 29일');
    });

    it('should handle December dates', () => {
      const result = formatDate('2024-12-25');
      expect(result).toBe('2024년 12월 25일');
    });

    it('should handle dates with time components', () => {
      const result1 = formatDate('2024-10-30T00:00:00');
      const result2 = formatDate('2024-10-30T23:59:59');
      // Both should format to the same date (not time-dependent)
      expect(result1).toBe('2024년 10월 30일');
      expect(result2).toBe('2024년 10월 30일');
    });
  });
});
