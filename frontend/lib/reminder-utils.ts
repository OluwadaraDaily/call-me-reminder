import * as z from 'zod';
import { isValidPhoneNumber } from '@/lib/phone-validation';

// Generate timezone options from UTC-12 to UTC+14
export const TIMEZONE_OPTIONS = Array.from({ length: 27 }, (_, i) => {
  const offset = i - 12;
  const sign = offset >= 0 ? '+' : '';
  return {
    value: `UTC${sign}${offset}`,
    label: `UTC${sign}${offset}`,
  };
});

export function getDefaultTimezone(): string {
  const offset = -new Date().getTimezoneOffset() / 60;
  const sign = offset >= 0 ? '+' : '';
  return `UTC${sign}${offset}`;
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
