'use client';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Reminder } from '@/types/reminder';
import { Loader2 } from 'lucide-react';

interface DeleteReminderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reminder: Reminder | null;
  onConfirm: () => Promise<void>;
  isDeleting?: boolean;
}

export function DeleteReminderDialog({
  open,
  onOpenChange,
  reminder,
  onConfirm,
  isDeleting = false,
}: DeleteReminderDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete the reminder
            {reminder && (
              <>
                {' '}
                <span className="font-semibold text-gray-900">&quot;{reminder.title}&quot;</span>
              </>
            )}
            .
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={async (e) => {
              e.preventDefault();
              await onConfirm();
            }}
            disabled={isDeleting}
            className="bg-red-600 hover:bg-red-700"
          >
            {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isDeleting ? 'Deleting...' : 'Delete'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
