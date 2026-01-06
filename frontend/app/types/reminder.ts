export type ReminderStatus = 'scheduled' | 'completed' | 'failed';

export interface Reminder {
  id: number;
  user_id: number;
  title: string;
  message: string;
  phone_number: string;
  date_time: string; // ISO 8601 datetime string
  timezone: string;
  status: ReminderStatus;
  created_at: string;
  updated_at: string;
}

export interface ReminderCreate {
  title: string;
  message: string;
  phone_number: string;
  date_time: string;
  timezone: string;
}

export interface ReminderUpdate {
  title?: string;
  message?: string;
  phone_number?: string;
  date_time?: string;
  timezone?: string;
  status?: ReminderStatus;
}
