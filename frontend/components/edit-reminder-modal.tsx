'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Reminder, ReminderUpdate } from '@/types/reminder';
import { Loader2 } from 'lucide-react';
import { format } from 'date-fns';

const reminderFormSchema = z.object({
  title: z.string().min(1, 'Title is required').max(100, 'Title must be 100 characters or less'),
  message: z.string().min(1, 'Message is required').max(500, 'Message must be 500 characters or less'),
  phone_number: z.string().min(10, 'Phone number must be at least 10 digits').regex(/^[\d\s\+\-\(\)]+$/, 'Invalid phone number format'),
  date_time: z.string().min(1, 'Date and time is required').refine(
    (val) => {
      const date = new Date(val);
      return date > new Date();
    },
    { message: 'Date and time must be in the future' }
  ),
  timezone: z.string().min(1, 'Timezone is required'),
});

type ReminderFormValues = z.infer<typeof reminderFormSchema>;

interface EditReminderModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reminder: Reminder | null;
  onSubmit: (id: number, data: ReminderUpdate) => Promise<void>;
}

// Generate timezone options from UTC-12 to UTC+14
const TIMEZONE_OPTIONS = Array.from({ length: 27 }, (_, i) => {
  const offset = i - 12;
  const sign = offset >= 0 ? '+' : '';
  return {
    value: `UTC${sign}${offset}`,
    label: `UTC${sign}${offset}`,
  };
});

export function EditReminderModal({ open, onOpenChange, reminder, onSubmit }: EditReminderModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<ReminderFormValues>({
    resolver: zodResolver(reminderFormSchema),
    defaultValues: {
      title: '',
      message: '',
      phone_number: '',
      date_time: '',
      timezone: '',
    },
  });

  // Update form values when reminder changes
  useEffect(() => {
    if (reminder && open) {
      // Convert ISO datetime to datetime-local format (YYYY-MM-DDTHH:mm)
      const dateTime = new Date(reminder.date_time);
      const localDateTime = format(dateTime, "yyyy-MM-dd'T'HH:mm");

      form.reset({
        title: reminder.title,
        message: reminder.message,
        phone_number: reminder.phone_number,
        date_time: localDateTime,
        timezone: reminder.timezone,
      });
    }
  }, [reminder, open, form]);

  const handleSubmit = async (values: ReminderFormValues) => {
    if (!reminder) return;

    setIsSubmitting(true);
    try {
      // Clean phone number: remove spaces, hyphens, and parentheses, keep only + and digits
      const cleanedPhoneNumber = values.phone_number.replace(/[\s\-\(\)]/g, '');

      await onSubmit(reminder.id, {
        ...values,
        phone_number: cleanedPhoneNumber,
      });
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to update reminder:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    onOpenChange(false);
  };

  const getMinDateTime = () => {
    const now = new Date();
    now.setMinutes(now.getMinutes() + 1);
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Edit Reminder</DialogTitle>
          <DialogDescription>
            Update your reminder details. We'll call you at the specified time.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input placeholder="Meeting with John" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="message"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Message</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Don't forget to bring the presentation slides"
                      className="resize-none"
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    This message will be read to you during the call
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="phone_number"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone Number</FormLabel>
                  <FormControl>
                    <Input placeholder="+1 (555) 123-4567" {...field} />
                  </FormControl>
                  <FormDescription>
                    Include country code (e.g., +1 for US)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="date_time"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Date & Time</FormLabel>
                  <FormControl>
                    <Input
                      type="datetime-local"
                      min={getMinDateTime()}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="timezone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Timezone</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select your timezone" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {TIMEZONE_OPTIONS.map((tz) => (
                        <SelectItem key={tz.value} value={tz.value}>
                          {tz.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Select the timezone for your reminder
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={handleCancel}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isSubmitting ? 'Updating...' : 'Update Reminder'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
