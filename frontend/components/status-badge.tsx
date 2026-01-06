import { ReminderStatus } from '@/types/reminder';
import { cn } from '@/lib/utils';

interface StatusBadgeProps {
  status: ReminderStatus;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const variants = {
    scheduled: {
      bg: 'bg-blue-100',
      text: 'text-blue-800',
      label: 'Scheduled',
    },
    completed: {
      bg: 'bg-green-100',
      text: 'text-green-800',
      label: 'Completed',
    },
    failed: {
      bg: 'bg-red-100',
      text: 'text-red-800',
      label: 'Failed',
    },
  };

  const variant = variants[status];

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
        variant.bg,
        variant.text,
        className
      )}
    >
      {variant.label}
    </span>
  );
}
