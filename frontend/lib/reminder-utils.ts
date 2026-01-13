import * as z from 'zod';
import { isValidPhoneNumber } from '@/lib/phone-validation';

// Common IANA timezone identifiers grouped by region
// This list includes major timezones and those with half-hour/quarter-hour offsets
const TIMEZONE_DATA = [
  // Americas
  { value: 'America/New_York', label: 'Eastern Time (US & Canada)', offset: 'UTC-5/-4' },
  { value: 'America/Chicago', label: 'Central Time (US & Canada)', offset: 'UTC-6/-5' },
  { value: 'America/Denver', label: 'Mountain Time (US & Canada)', offset: 'UTC-7/-6' },
  { value: 'America/Los_Angeles', label: 'Pacific Time (US & Canada)', offset: 'UTC-8/-7' },
  { value: 'America/Anchorage', label: 'Alaska', offset: 'UTC-9/-8' },
  { value: 'Pacific/Honolulu', label: 'Hawaii', offset: 'UTC-10' },
  { value: 'America/Toronto', label: 'Toronto', offset: 'UTC-5/-4' },
  { value: 'America/Vancouver', label: 'Vancouver', offset: 'UTC-8/-7' },
  { value: 'America/Mexico_City', label: 'Mexico City', offset: 'UTC-6/-5' },
  { value: 'America/Sao_Paulo', label: 'São Paulo', offset: 'UTC-3/-2' },
  { value: 'America/Buenos_Aires', label: 'Buenos Aires', offset: 'UTC-3' },
  { value: 'America/St_Johns', label: 'Newfoundland', offset: 'UTC-3:30/-2:30' },

  // Europe
  { value: 'Europe/London', label: 'London', offset: 'UTC+0/+1' },
  { value: 'Europe/Paris', label: 'Paris, Berlin, Rome', offset: 'UTC+1/+2' },
  { value: 'Europe/Athens', label: 'Athens, Istanbul', offset: 'UTC+2/+3' },
  { value: 'Europe/Moscow', label: 'Moscow', offset: 'UTC+3' },

  // Asia
  { value: 'Asia/Dubai', label: 'Dubai', offset: 'UTC+4' },
  { value: 'Asia/Kolkata', label: 'India', offset: 'UTC+5:30' },
  { value: 'Asia/Kathmandu', label: 'Kathmandu', offset: 'UTC+5:45' },
  { value: 'Asia/Dhaka', label: 'Dhaka', offset: 'UTC+6' },
  { value: 'Asia/Bangkok', label: 'Bangkok, Jakarta', offset: 'UTC+7' },
  { value: 'Asia/Singapore', label: 'Singapore, Hong Kong', offset: 'UTC+8' },
  { value: 'Asia/Shanghai', label: 'Beijing, Shanghai', offset: 'UTC+8' },
  { value: 'Asia/Tokyo', label: 'Tokyo, Seoul', offset: 'UTC+9' },
  { value: 'Asia/Kabul', label: 'Kabul', offset: 'UTC+4:30' },
  { value: 'Asia/Tehran', label: 'Tehran', offset: 'UTC+3:30/+4:30' },

  // Australia & Pacific
  { value: 'Australia/Sydney', label: 'Sydney, Melbourne', offset: 'UTC+10/+11' },
  { value: 'Australia/Brisbane', label: 'Brisbane', offset: 'UTC+10' },
  { value: 'Australia/Adelaide', label: 'Adelaide', offset: 'UTC+9:30/+10:30' },
  { value: 'Australia/Perth', label: 'Perth', offset: 'UTC+8' },
  { value: 'Australia/Darwin', label: 'Darwin', offset: 'UTC+9:30' },
  { value: 'Pacific/Auckland', label: 'Auckland', offset: 'UTC+12/+13' },
  { value: 'Pacific/Fiji', label: 'Fiji', offset: 'UTC+12/+13' },

  // Africa
  { value: 'Africa/Cairo', label: 'Cairo', offset: 'UTC+2' },
  { value: 'Africa/Johannesburg', label: 'Johannesburg', offset: 'UTC+2' },
  { value: 'Africa/Lagos', label: 'Lagos, West Africa', offset: 'UTC+1' },
  { value: 'Africa/Nairobi', label: 'Nairobi', offset: 'UTC+3' },

  // UTC
  { value: 'UTC', label: 'UTC (Coordinated Universal Time)', offset: 'UTC+0' },
];

export const TIMEZONE_OPTIONS = TIMEZONE_DATA.map(tz => ({
  value: tz.value,
  label: `${tz.label} (${tz.offset})`,
}));

export function getDefaultTimezone(): string {
  try {
    // Use the browser's IANA timezone identifier
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch (error) {
    // Fallback to UTC if unable to detect
    console.warn('Unable to detect timezone, falling back to UTC', error);
    return 'UTC';
  }
}

export function getMinDateTime(): string {
  const now = new Date();
  now.setMinutes(now.getMinutes() + 1);
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

export const reminderFormSchema = z.object({
  title: z.string().min(1, 'Title is required').max(100, 'Title must be 100 characters or less'),
  message: z.string().min(1, 'Message is required').max(500, 'Message must be 500 characters or less'),
  phone_number: z
    .string()
    .min(1, 'Phone number is required')
    .refine((val) => isValidPhoneNumber(val), {
      message: 'Please enter a valid phone number',
    }),
  date_time: z.string().min(1, 'Date and time is required').refine(
    (val) => {
      const date = new Date(val);
      return date > new Date();
    },
    { message: 'Date and time must be in the future' }
  ),
  timezone: z.string().min(1, 'Timezone is required'),
});

export type ReminderFormValues = z.infer<typeof reminderFormSchema>;
