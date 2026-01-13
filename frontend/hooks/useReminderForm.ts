import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { format } from 'date-fns';
import { CountryCode } from 'libphonenumber-js';
import { toast } from 'sonner';
import {
  reminderFormSchema,
  ReminderFormValues,
  getDefaultTimezone,
} from '@/lib/reminder-utils';
import {
  detectUserCountry,
  getCountryFromPhoneNumber,
  formatPhoneNumberE164,
} from '@/lib/phone-validation';
import { Reminder } from '@/types/reminder';

interface UseReminderFormOptions {
  mode: 'create' | 'edit';
  reminder?: Reminder | null;
  isOpen?: boolean;
  onSuccess?: () => void;
}

export function useReminderForm({ mode, reminder, isOpen, onSuccess }: UseReminderFormOptions) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [defaultCountry, setDefaultCountry] = useState<CountryCode>('US');

  const form = useForm<ReminderFormValues>({
    resolver: zodResolver(reminderFormSchema),
    defaultValues: {
      title: '',
      message: '',
      phone_number: '',
      date_time: '',
      timezone: getDefaultTimezone(),
    },
  });

  // Detect user's country on mount for create mode
  useEffect(() => {
    if (mode === 'create') {
      detectUserCountry().then(setDefaultCountry);
    }
  }, [mode]);

  // Populate form when editing
  useEffect(() => {
    if (mode === 'edit' && reminder && isOpen) {
      // Convert ISO datetime to datetime-local format (YYYY-MM-DDTHH:mm)
      const dateTime = new Date(reminder.date_time);
      const localDateTime = format(dateTime, "yyyy-MM-dd'T'HH:mm");

      // Detect country from existing phone number
      const detectedCountry = getCountryFromPhoneNumber(reminder.phone_number);
      if (detectedCountry) {
        setDefaultCountry(detectedCountry);
      }

      form.reset({
        title: reminder.title,
        message: reminder.message,
        phone_number: reminder.phone_number,
        date_time: localDateTime,
        timezone: reminder.timezone,
      });
    }
  }, [mode, reminder, isOpen, form]);

  const handleSubmit = async (
    values: ReminderFormValues,
    onSubmitCallback: (values: ReminderFormValues & { phone_number: string }) => Promise<void>
  ) => {
    setIsSubmitting(true);
    try {
      // Format phone number to E.164 format for backend
      const formattedPhoneNumber = formatPhoneNumberE164(values.phone_number);

      await onSubmitCallback({
        ...values,
        phone_number: formattedPhoneNumber,
      });

      if (mode === 'create') {
        form.reset({
          title: '',
          message: '',
          phone_number: '',
          date_time: '',
          timezone: getDefaultTimezone(),
        });
      }

      onSuccess?.();
    } catch (error) {
      const action = mode === 'create' ? 'create' : 'update';
      toast.error(`Failed to ${action} reminder. Please try again.`);
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    form.reset({
      title: '',
      message: '',
      phone_number: '',
      date_time: '',
      timezone: getDefaultTimezone(),
    });
  };

  return {
    form,
    isSubmitting,
    defaultCountry,
    handleSubmit,
    resetForm,
  };
}
