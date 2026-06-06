const { isValidZipCode, isValidLatitude, isValidLongitude, isValidDate, isValidAddress, sanitize } = require('../../src/utils/validation');

describe('Validation Utils', () => {
  describe('isValidZipCode', () => {
    it('accepts 5-digit ZIP codes', () => {
      expect(isValidZipCode('73301')).toBe(true);
      expect(isValidZipCode('00000')).toBe(true);
      expect(isValidZipCode('99999')).toBe(true);
    });

    it('accepts ZIP+4 format', () => {
      expect(isValidZipCode('73301-1234')).toBe(true);
    });

    it('rejects invalid ZIP codes', () => {
      expect(isValidZipCode('1234')).toBe(false);
      expect(isValidZipCode('123456')).toBe(false);
      expect(isValidZipCode('abcde')).toBe(false);
      expect(isValidZipCode('')).toBe(false);
    });
  });

  describe('isValidLatitude', () => {
    it('accepts valid latitudes', () => {
      expect(isValidLatitude(0)).toBe(true);
      expect(isValidLatitude(90)).toBe(true);
      expect(isValidLatitude(-90)).toBe(true);
      expect(isValidLatitude(30.2672)).toBe(true);
    });

    it('rejects out-of-range latitudes', () => {
      expect(isValidLatitude(91)).toBe(false);
      expect(isValidLatitude(-91)).toBe(false);
      expect(isValidLatitude(NaN)).toBe(false);
    });
  });

  describe('isValidLongitude', () => {
    it('accepts valid longitudes', () => {
      expect(isValidLongitude(0)).toBe(true);
      expect(isValidLongitude(180)).toBe(true);
      expect(isValidLongitude(-180)).toBe(true);
      expect(isValidLongitude(-97.7431)).toBe(true);
    });

    it('rejects out-of-range longitudes', () => {
      expect(isValidLongitude(181)).toBe(false);
      expect(isValidLongitude(-181)).toBe(false);
    });
  });

  describe('isValidDate', () => {
    it('accepts valid YYYY-MM-DD dates', () => {
      expect(isValidDate('2024-01-15')).toBe(true);
      expect(isValidDate('2023-12-31')).toBe(true);
    });

    it('rejects invalid dates', () => {
      expect(isValidDate('01-15-2024')).toBe(false);
      expect(isValidDate('2024/01/15')).toBe(false);
      expect(isValidDate('not-a-date')).toBe(false);
      expect(isValidDate('')).toBe(false);
    });
  });

  describe('isValidAddress', () => {
    it('accepts valid addresses', () => {
      expect(isValidAddress('123 Main St, Austin, TX')).toBe(true);
      expect(isValidAddress('NYC')).toBe(true);
    });

    it('rejects too-short or invalid addresses', () => {
      expect(isValidAddress('')).toBe(false);
      expect(isValidAddress('ab')).toBe(false);
      expect(isValidAddress(123)).toBe(false);
      expect(isValidAddress(null)).toBe(false);
    });
  });

  describe('sanitize', () => {
    it('removes potentially dangerous characters', () => {
      expect(sanitize('<script>alert("xss")</script>')).toBe('scriptalert(xss)/script');
      expect(sanitize('normal text')).toBe('normal text');
    });

    it('handles non-string input', () => {
      expect(sanitize(123)).toBe('');
      expect(sanitize(null)).toBe('');
    });

    it('trims whitespace', () => {
      expect(sanitize('  hello  ')).toBe('hello');
    });
  });
});
