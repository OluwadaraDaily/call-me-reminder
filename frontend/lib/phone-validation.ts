import {
  isValidPhoneNumber as libIsValidPhoneNumber,
  parsePhoneNumber,
  getExampleNumber,
  CountryCode,
} from 'libphonenumber-js';
import examples from 'libphonenumber-js/mobile/examples';

/**
 * Validates if a phone number is valid
 * @param value - Phone number string (can be in any format)
 * @returns boolean indicating if the phone number is valid
 */
export function isValidPhoneNumber(value: string | undefined): boolean {
  if (!value || value.length < 4) return false;

  try {
    return libIsValidPhoneNumber(value);
  } catch {
    return false;
  }
}

/**
 * Gets detailed information about a phone number
 * @param value - Phone number string
 * @returns Object with country code, national number, and format example
 */
export function getPhoneNumberDetails(value: string | undefined): {
  country: CountryCode | undefined;
  nationalNumber: string | undefined;
  example: string | undefined;
} | null {
  if (!value) return null;

  try {
    const phoneNumber = parsePhoneNumber(value);

    if (!phoneNumber) return null;

    const country = phoneNumber.country;
    const example = country ? getExampleNumber(country, examples)?.formatInternational() : undefined;

    return {
      country,
      nationalNumber: phoneNumber.nationalNumber,
      example,
    };
  } catch {
    return null;
  }
}

/**
 * Detects the user's country based on browser locale
 * Falls back to 'US' if detection fails
 * @returns Promise<CountryCode> - ISO 3166-1 alpha-2 country code
 */
export async function detectUserCountry(): Promise<CountryCode> {
  try {
    // Try to get country from browser language (e.g., "en-US" -> "US")
    const locale = navigator.language || navigator.languages?.[0];

    if (locale) {
      const parts = locale.split('-');
      if (parts.length === 2) {
        const countryCode = parts[1].toUpperCase() as CountryCode;
        // Validate it's a real country code
        if (countryCode.length === 2) {
          return countryCode;
        }
      }
    }

    // Fallback to US
    return 'US';
  } catch {
    // If anything fails, default to US
    return 'US';
  }
}

/**
 * Formats a phone number to E.164 format for backend submission
 * @param value - Phone number in any format
 * @returns Phone number in E.164 format (e.g., "+15551234567")
 */
export function formatPhoneNumberE164(value: string | undefined): string {
  if (!value) return '';

  try {
    const phoneNumber = parsePhoneNumber(value);

    if (!phoneNumber) return value;

    return phoneNumber.format('E.164');
  } catch {
    // If parsing fails, return original value
    return value;
  }
}

/**
 * Gets the country code from an existing phone number
 * Useful for Edit Modal to detect country from existing reminder
 * @param value - Phone number string
 * @returns CountryCode or undefined
 */
export function getCountryFromPhoneNumber(value: string | undefined): CountryCode | undefined {
  if (!value) return undefined;

  try {
    const phoneNumber = parsePhoneNumber(value);
    return phoneNumber?.country;
  } catch {
    return undefined;
  }
}
