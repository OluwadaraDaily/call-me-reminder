'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Form } from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { Reminder, ReminderUpdate } from '@/types/reminder';
import { Loader2 } from 'lucide-react';
import { useReminderForm } from '@/hooks/useReminderForm';
import { ReminderFormFields } from '@/components/reminder-form-fields';
import { ReminderFormValues } from '@/lib/reminder-utils';

interface EditReminderModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reminder: Reminder | null;
  onSubmit: (id: number, data: ReminderUpdate) => Promise<void>;
}

export function EditReminderModal({ open, onOpenChange, reminder, onSubmit }: EditReminderModalProps) {
  const { form, isSubmitting, defaultCountry, handleSubmit } = useReminderForm({
    mode: 'edit',
    reminder,
    isOpen: open,
    onSuccess: () => onOpenChange(false),
  });

  const onFormSubmit = async (values: ReminderFormValues) => {
    if (!reminder) return;
    await handleSubmit(values, async (formattedValues) => {
      await onSubmit(reminder.id, formattedValues);
    });
  };

  const handleCancel = () => {
    onOpenChange(false);
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
          <form onSubmit={form.handleSubmit(onFormSubmit)} className="space-y-4">
            <ReminderFormFields form={form} defaultCountry={defaultCountry} mode="edit" />

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
