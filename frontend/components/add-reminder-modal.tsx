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
import { ReminderCreate } from '@/types/reminder';
import { Loader2 } from 'lucide-react';
import { useReminderForm } from '@/hooks/useReminderForm';
import { ReminderFormFields } from '@/components/reminder-form-fields';

interface AddReminderModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: ReminderCreate) => Promise<void>;
}

export function AddReminderModal({ open, onOpenChange, onSubmit }: AddReminderModalProps) {
  const { form, isSubmitting, defaultCountry, handleSubmit, resetForm } = useReminderForm({
    mode: 'create',
    onSuccess: () => onOpenChange(false),
  });

  const onFormSubmit = async (values: Parameters<typeof onSubmit>[0]) => {
    await handleSubmit(values, onSubmit);
  };

  const handleCancel = () => {
    resetForm();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add New Reminder</DialogTitle>
          <DialogDescription>
            Create a new reminder. We'll call you at the specified time.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onFormSubmit)} className="space-y-4">
            <ReminderFormFields form={form} defaultCountry={defaultCountry} mode="create" />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={handleCancel}
                disabled={isSubmitting}
                data-testid="create-reminder-cancel-btn"
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting} data-testid="create-reminder-submit-btn">
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isSubmitting ? 'Creating...' : 'Create Reminder'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
