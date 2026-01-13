import {
  isValidPhoneNumber,
  getPhoneNumberDetails,
  detectUserCountry,
  formatPhoneNumberE164,
  getCountryFromPhoneNumber,
} from '../../lib/phone-validation';

describe('Phone Validation Utilities', () => {
  describe('isValidPhoneNumber', () => {
    it('should return true for valid US phone number with country code', () => {
      expect(isValidPhoneNumber('+1 (202) 555-1234')).to.be.true;
      expect(isValidPhoneNumber('+12025551234')).to.be.true;
    });

    it('should return true for valid international phone numbers', () => {
      expect(isValidPhoneNumber('+44 20 7946 0958')).to.be.true; // UK
      expect(isValidPhoneNumber('+33 1 42 86 82 00')).to.be.true; // France
      expect(isValidPhoneNumber('+81 3-1234-5678')).to.be.true; // Japan
      expect(isValidPhoneNumber('+61 2 1234 5678')).to.be.true; // Australia
    });

    it('should return false for invalid phone numbers', () => {
      expect(isValidPhoneNumber('123')).to.be.false;
      expect(isValidPhoneNumber('abc')).to.be.false;
      expect(isValidPhoneNumber('+1 234')).to.be.false;
    });

    it('should return false for undefined or empty values', () => {
      expect(isValidPhoneNumber(undefined)).to.be.false;
      expect(isValidPhoneNumber('')).to.be.false;
      expect(isValidPhoneNumber('   ')).to.be.false;
    });

    it('should return false for very short strings', () => {
      expect(isValidPhoneNumber('12')).to.be.false;
      expect(isValidPhoneNumber('123')).to.be.false;
    });

    it('should handle malformed input gracefully', () => {
      expect(isValidPhoneNumber('++1234567890')).to.be.false;
      expect(isValidPhoneNumber('++')).to.be.false;
      expect(isValidPhoneNumber('+ 1 234 567 890 1234 5678')).to.be.false;
    });
  });

  describe('getPhoneNumberDetails', () => {
    it('should return country and national number for valid US number', () => {
      const details = getPhoneNumberDetails('+12025551234');
      expect(details).to.not.be.null;
      expect(details?.country).to.equal('US');
      expect(details?.nationalNumber).to.equal('2025551234');
      expect(details?.example).to.include('+1');
    });

    it('should return country and national number for valid UK number', () => {
      const details = getPhoneNumberDetails('+442079460958');
      expect(details).to.not.be.null;
      expect(details?.country).to.equal('GB');
      expect(details?.nationalNumber).to.equal('2079460958');
    });

    it('should return country and national number for valid Indian number', () => {
      const details = getPhoneNumberDetails('+919876543210');
      expect(details).to.not.be.null;
      expect(details?.country).to.equal('IN');
      expect(details?.nationalNumber).to.equal('9876543210');
    });

    it('should return null for invalid phone numbers', () => {
      expect(getPhoneNumberDetails('123')).to.be.null;
      expect(getPhoneNumberDetails('invalid')).to.be.null;
    });

    it('should return null for undefined or empty values', () => {
      expect(getPhoneNumberDetails(undefined)).to.be.null;
      expect(getPhoneNumberDetails('')).to.be.null;
    });

    it('should include example format for known countries', () => {
      const details = getPhoneNumberDetails('+12025551234');
      expect(details?.example).to.exist;
      expect(details?.example).to.be.a('string');
    });
  });

  describe('detectUserCountry', () => {
    it('should detect country from browser locale', async () => {
      // Mock navigator.language
      const originalLanguage = navigator.language;
      Object.defineProperty(navigator, 'language', {
        value: 'en-US',
        writable: true,
        configurable: true,
      });

      const country = await detectUserCountry();
      expect(country).to.equal('US');

      // Restore
      Object.defineProperty(navigator, 'language', {
        value: originalLanguage,
        writable: true,
        configurable: true,
      });
    });

    it('should detect different countries from locale', async () => {
      const testCases = [
        { locale: 'en-GB', expected: 'GB' },
        { locale: 'fr-FR', expected: 'FR' },
        { locale: 'de-DE', expected: 'DE' },
        { locale: 'ja-JP', expected: 'JP' },
      ];

      for (const testCase of testCases) {
        Object.defineProperty(navigator, 'language', {
          value: testCase.locale,
          writable: true,
          configurable: true,
        });

        const country = await detectUserCountry();
        expect(country).to.equal(testCase.expected);
      }
    });

    it('should fallback to US if locale has no country code', async () => {
      Object.defineProperty(navigator, 'language', {
        value: 'en',
        writable: true,
        configurable: true,
      });

      const country = await detectUserCountry();
      expect(country).to.equal('US');
    });

    it('should fallback to US if locale is unavailable', async () => {
      Object.defineProperty(navigator, 'language', {
        value: undefined,
        writable: true,
        configurable: true,
      });
      Object.defineProperty(navigator, 'languages', {
        value: undefined,
        writable: true,
        configurable: true,
      });

      const country = await detectUserCountry();
      expect(country).to.equal('US');
    });
  });

  describe('formatPhoneNumberE164', () => {
    it('should format valid US phone number to E.164', () => {
      expect(formatPhoneNumberE164('+1 (202) 555-1234')).to.equal('+12025551234');
      expect(formatPhoneNumberE164('+1 202 555 1234')).to.equal('+12025551234');
    });

    it('should format valid international phone numbers to E.164', () => {
      expect(formatPhoneNumberE164('+44 20 7946 0958')).to.equal('+442079460958');
      expect(formatPhoneNumberE164('+33 1 42 86 82 00')).to.equal('+33142868200');
      expect(formatPhoneNumberE164('+81 3-1234-5678')).to.equal('+81312345678');
    });

    it('should return original value if already in E.164 format', () => {
      expect(formatPhoneNumberE164('+12025551234')).to.equal('+12025551234');
      expect(formatPhoneNumberE164('+442079460958')).to.equal('+442079460958');
    });

    it('should return empty string for undefined or empty values', () => {
      expect(formatPhoneNumberE164(undefined)).to.equal('');
      expect(formatPhoneNumberE164('')).to.equal('');
    });

    it('should return original value for invalid phone numbers', () => {
      expect(formatPhoneNumberE164('invalid')).to.equal('invalid');
      expect(formatPhoneNumberE164('123')).to.equal('123');
    });

    it('should handle phone numbers with various formatting', () => {
      const testCases = [
        { input: '+1(202)555-1234', expected: '+12025551234' },
        { input: '+1 202.555.1234', expected: '+12025551234' },
        { input: '+1-202-555-1234', expected: '+12025551234' },
      ];

      testCases.forEach(({ input, expected }) => {
        expect(formatPhoneNumberE164(input)).to.equal(expected);
      });
    });
  });

  describe('getCountryFromPhoneNumber', () => {
    it('should return US for valid US phone number', () => {
      expect(getCountryFromPhoneNumber('+12025551234')).to.equal('US');
      expect(getCountryFromPhoneNumber('+1 (202) 555-1234')).to.equal('US');
    });

    it('should return correct country for international numbers', () => {
      expect(getCountryFromPhoneNumber('+442079460958')).to.equal('GB');
      expect(getCountryFromPhoneNumber('+33142868200')).to.equal('FR');
      expect(getCountryFromPhoneNumber('+81312345678')).to.equal('JP');
      expect(getCountryFromPhoneNumber('+61212345678')).to.equal('AU');
      expect(getCountryFromPhoneNumber('+919876543210')).to.equal('IN');
    });

    it('should return undefined for invalid phone numbers', () => {
      expect(getCountryFromPhoneNumber('invalid')).to.be.undefined;
      expect(getCountryFromPhoneNumber('123')).to.be.undefined;
    });

    it('should return undefined for undefined or empty values', () => {
      expect(getCountryFromPhoneNumber(undefined)).to.be.undefined;
      expect(getCountryFromPhoneNumber('')).to.be.undefined;
    });

    it('should handle various phone number formats', () => {
      expect(getCountryFromPhoneNumber('+44 20 7946 0958')).to.equal('GB');
      expect(getCountryFromPhoneNumber('+44-20-7946-0958')).to.equal('GB');
      expect(getCountryFromPhoneNumber('+44 (20) 7946-0958')).to.equal('GB');
    });
  });

  describe('Edge Cases and Integration', () => {
    it('should handle phone numbers with special half-hour timezone countries', () => {
      // India uses UTC+5:30
      const indiaNumber = '+919876543210';
      expect(isValidPhoneNumber(indiaNumber)).to.be.true;
      expect(formatPhoneNumberE164(indiaNumber)).to.equal('+919876543210');
      expect(getCountryFromPhoneNumber(indiaNumber)).to.equal('IN');
    });

    it('should handle phone numbers from countries with unusual formats', () => {
      // Newfoundland, Canada uses UTC-3:30
      const canadaNumber = '+17095551234';
      expect(isValidPhoneNumber(canadaNumber)).to.be.true;
      expect(getCountryFromPhoneNumber(canadaNumber)).to.equal('CA');
    });

    it('should validate and format in sequence', () => {
      const input = '+1 (202) 555-1234';

      // Validate
      expect(isValidPhoneNumber(input)).to.be.true;

      // Format
      const formatted = formatPhoneNumberE164(input);
      expect(formatted).to.equal('+12025551234');

      // Get country
      const country = getCountryFromPhoneNumber(formatted);
      expect(country).to.equal('US');

      // Get details
      const details = getPhoneNumberDetails(formatted);
      expect(details?.country).to.equal('US');
      expect(details?.nationalNumber).to.equal('2025551234');
    });

    it('should handle numbers without country code prefix', () => {
      // These should fail validation without country code
      expect(isValidPhoneNumber('2025551234')).to.be.false;
      expect(isValidPhoneNumber('(555) 123-4567')).to.be.false;
    });
  });
});
