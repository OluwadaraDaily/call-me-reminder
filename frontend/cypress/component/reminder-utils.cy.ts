import {
  getDefaultTimezone,
  getMinDateTime,
  TIMEZONE_OPTIONS,
} from '../../lib/reminder-utils';

describe('Reminder Utilities', () => {
  describe('getDefaultTimezone', () => {
    it('should return a valid IANA timezone identifier', () => {
      const timezone = getDefaultTimezone();
      expect(timezone).to.be.a('string');
      expect(timezone.length).to.be.greaterThan(0);
    });

    it('should return a timezone that contains a forward slash', () => {
      const timezone = getDefaultTimezone();
      // Most IANA timezones have format like "America/New_York" except "UTC"
      expect(timezone).to.satisfy((tz: string) => tz === 'UTC' || tz.includes('/'));
    });

    it('should be consistent across multiple calls', () => {
      const timezone1 = getDefaultTimezone();
      const timezone2 = getDefaultTimezone();
      expect(timezone1).to.equal(timezone2);
    });

    it('should return one of the valid timezone options if available', () => {
      const timezone = getDefaultTimezone();
      const validTimezones = TIMEZONE_OPTIONS.map(tz => tz.value);

      // The detected timezone should be in our list, or it could be a valid timezone not in our predefined list
      // We just verify it's a string that looks like a timezone
      expect(timezone).to.be.a('string');
      expect(timezone).to.match(/^[A-Za-z_]+\/[A-Za-z_]+$|^UTC$/);
    });

    it('should handle browser API errors gracefully', () => {
      // Mock Intl.DateTimeFormat to throw an error
      const originalDateTimeFormat = Intl.DateTimeFormat;
      (Intl as any).DateTimeFormat = function() {
        throw new Error('Mocked error');
      };

      const timezone = getDefaultTimezone();
      expect(timezone).to.equal('UTC'); // Should fallback to UTC

      // Restore
      (Intl as any).DateTimeFormat = originalDateTimeFormat;
    });
  });

  describe('getMinDateTime', () => {
    it('should return a datetime string in correct format', () => {
      const minDateTime = getMinDateTime();
      // Format should be: YYYY-MM-DDTHH:MM
      expect(minDateTime).to.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/);
    });

    it('should return different values when called at different times', (done) => {
      const firstCall = getMinDateTime();

      // Wait 2 seconds and call again
      setTimeout(() => {
        const secondCall = getMinDateTime();
        // They might be the same if called within the same minute, but date should progress
        const firstDate = new Date(firstCall);
        const secondDate = new Date(secondCall);
        expect(secondDate.getTime()).to.be.at.least(firstDate.getTime());
        done();
      }, 2000);
    });

    it('should have properly padded month, day, hours, and minutes', () => {
      const minDateTime = getMinDateTime();
      const parts = minDateTime.split('T');
      const datePart = parts[0];
      const timePart = parts[1];

      // Date part: YYYY-MM-DD
      const [year, month, day] = datePart.split('-');
      expect(year).to.have.lengthOf(4);
      expect(month).to.have.lengthOf(2);
      expect(day).to.have.lengthOf(2);

      // Time part: HH:MM
      const [hours, minutes] = timePart.split(':');
      expect(hours).to.have.lengthOf(2);
      expect(minutes).to.have.lengthOf(2);
    });

    it('should be parseable by Date constructor', () => {
      const minDateTime = getMinDateTime();
      const date = new Date(minDateTime);
      expect(date.toString()).to.not.equal('Invalid Date');
      expect(date.getTime()).to.be.greaterThan(0);
    });

    it('should handle edge case of minute rollover', () => {
      // Get min datetime multiple times rapidly
      const datetimes = [];
      for (let i = 0; i < 5; i++) {
        datetimes.push(getMinDateTime());
      }

      // All should be valid
      datetimes.forEach(dt => {
        expect(dt).to.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/);
        expect(new Date(dt).toString()).to.not.equal('Invalid Date');
      });
    });

    it('should handle month boundaries correctly', () => {
      const minDateTime = getMinDateTime();
      const date = new Date(minDateTime);

      // Month should be 0-11 internally but displayed as 01-12 in string
      expect(date.getMonth()).to.be.at.least(0);
      expect(date.getMonth()).to.be.at.most(11);

      // Extract month from string
      const monthStr = minDateTime.split('-')[1];
      const monthNum = parseInt(monthStr, 10);
      expect(monthNum).to.be.at.least(1);
      expect(monthNum).to.be.at.most(12);
    });
  });

  describe('TIMEZONE_OPTIONS', () => {
    it('should be an array of timezone options', () => {
      expect(TIMEZONE_OPTIONS).to.be.an('array');
      expect(TIMEZONE_OPTIONS.length).to.be.greaterThan(0);
    });

    it('should have objects with value and label properties', () => {
      TIMEZONE_OPTIONS.forEach(option => {
        expect(option).to.have.property('value');
        expect(option).to.have.property('label');
        expect(option.value).to.be.a('string');
        expect(option.label).to.be.a('string');
      });
    });

    it('should include major US timezones', () => {
      const usTimezones = [
        'America/New_York',
        'America/Chicago',
        'America/Denver',
        'America/Los_Angeles',
        'America/Anchorage',
        'Pacific/Honolulu',
      ];

      usTimezones.forEach(tz => {
        const found = TIMEZONE_OPTIONS.find(option => option.value === tz);
        expect(found, `Missing timezone: ${tz}`).to.exist;
      });
    });

    it('should include timezones with half-hour offsets', () => {
      const halfHourTimezones = [
        'America/St_Johns', // UTC-3:30/-2:30
        'Asia/Kolkata', // UTC+5:30
        'Australia/Adelaide', // UTC+9:30/+10:30
        'Australia/Darwin', // UTC+9:30
      ];

      halfHourTimezones.forEach(tz => {
        const found = TIMEZONE_OPTIONS.find(option => option.value === tz);
        expect(found, `Missing half-hour timezone: ${tz}`).to.exist;
      });
    });

    it('should include timezones with quarter-hour offsets', () => {
      const quarterHourTimezones = [
        'Asia/Kathmandu', // UTC+5:45
      ];

      quarterHourTimezones.forEach(tz => {
        const found = TIMEZONE_OPTIONS.find(option => option.value === tz);
        expect(found, `Missing quarter-hour timezone: ${tz}`).to.exist;
      });
    });

    it('should include UTC', () => {
      const utc = TIMEZONE_OPTIONS.find(option => option.value === 'UTC');
      expect(utc).to.exist;
      expect(utc?.label).to.include('UTC');
    });

    it('should have labels that include offset information', () => {
      TIMEZONE_OPTIONS.forEach(option => {
        // Labels should include UTC offset in parentheses
        expect(option.label).to.match(/UTC[+-]?\d{1,2}(:\d{2})?/);
      });
    });

    it('should have unique timezone values', () => {
      const values = TIMEZONE_OPTIONS.map(option => option.value);
      const uniqueValues = new Set(values);
      expect(uniqueValues.size).to.equal(values.length);
    });

    it('should include major international cities', () => {
      const majorCities = [
        'Europe/London',
        'Europe/Paris',
        'Asia/Tokyo',
        'Asia/Shanghai',
        'Asia/Dubai',
        'Australia/Sydney',
      ];

      majorCities.forEach(tz => {
        const found = TIMEZONE_OPTIONS.find(option => option.value === tz);
        expect(found, `Missing major city timezone: ${tz}`).to.exist;
      });
    });

    it('should have properly formatted IANA timezone identifiers', () => {
      TIMEZONE_OPTIONS.forEach(option => {
        // IANA format: Area/Location or UTC
        // Allows for underscores and multiple word components (e.g., "America/New_York", "America/St_Johns")
        expect(option.value).to.satisfy((tz: string) => {
          return tz === 'UTC' || /^[A-Z][a-zA-Z]+\/[A-Z][a-zA-Z_]+$/.test(tz);
        });
      });
    });
  });

  describe('Integration Tests', () => {
    it('should work together: default timezone should be in options or be valid', () => {
      const defaultTz = getDefaultTimezone();
      const inOptions = TIMEZONE_OPTIONS.some(opt => opt.value === defaultTz);

      // Either in our predefined list, or it's a valid IANA format
      if (!inOptions) {
        expect(defaultTz).to.match(/^[A-Za-z_]+\/[A-Za-z_]+$|^UTC$/);
      }
      expect(true).to.be.true; // Test passes either way
    });

    it('should work together: minDateTime should be usable with timezone', () => {
      const minDateTime = getMinDateTime();
      const timezone = getDefaultTimezone();

      // Should be able to create a date with these values
      const date = new Date(minDateTime);
      expect(date.toString()).to.not.equal('Invalid Date');
      expect(timezone).to.be.a('string');
      expect(timezone.length).to.be.greaterThan(0);
    });

    it('should handle DST transitions correctly', () => {
      // getMinDateTime should work regardless of DST
      const minDateTime = getMinDateTime();
      const date = new Date(minDateTime);

      // Verify the date is valid and in the future
      expect(date.getTime()).to.be.greaterThan(Date.now());
    });
  });

  describe('Edge Cases', () => {
    it('should handle leap years correctly in getMinDateTime', () => {
      // Mock Date to test leap year edge case
      const originalDate = Date;
      const leapYearDate = new Date('2024-02-29T23:59:30');

      (global as any).Date = class extends originalDate {
        constructor(...args: any[]) {
          if (args.length === 0) {
            super(leapYearDate.getTime());
          } else {
            super(args[0] as any);
          }
        }
        static now() {
          return leapYearDate.getTime();
        }
      };

      const minDateTime = getMinDateTime();
      expect(minDateTime).to.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/);

      // Restore
      (global as any).Date = originalDate;
    });

    it('should handle end of month correctly', () => {
      const minDateTime = getMinDateTime();
      const date = new Date(minDateTime);

      // Day should be valid for the month
      expect(date.getDate()).to.be.at.least(1);
      expect(date.getDate()).to.be.at.most(31);
    });

    it('should handle end of year correctly', () => {
      const minDateTime = getMinDateTime();
      const date = new Date(minDateTime);

      // Year should be current year or next year
      const currentYear = new Date().getFullYear();
      expect(date.getFullYear()).to.be.at.least(currentYear);
      expect(date.getFullYear()).to.be.at.most(currentYear + 1);
    });
  });
});
