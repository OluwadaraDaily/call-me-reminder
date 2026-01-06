'use client';

import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
} from '@tanstack/react-table';
import { useState } from 'react';
import { format, formatDistanceToNow, isPast, parseISO } from 'date-fns';
import { Reminder } from '@/app/types/reminder';
import { StatusBadge } from './status-badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Clock, Phone } from 'lucide-react';

function maskPhoneNumber(phone: string): string {
  if (phone.length <= 4) return phone;
  const visible = phone.slice(-4);
  const masked = '*'.repeat(Math.min(phone.length - 4, 8));
  return masked + visible;
}

function formatDateTime(dateTimeStr: string): string {
  const date = parseISO(dateTimeStr);
  return format(date, 'MMM dd, yyyy · h:mm a');
}

function getTimeRemaining(dateTimeStr: string): string {
  const date = parseISO(dateTimeStr);
  if (isPast(date)) {
    return 'Expired';
  }
  return formatDistanceToNow(date, { addSuffix: true });
}

const columns: ColumnDef<Reminder>[] = [
  {
    accessorKey: 'title',
    header: 'Title',
    cell: ({ row }) => (
      <div className="font-medium text-gray-900">{row.getValue('title')}</div>
    ),
  },
  {
    accessorKey: 'date_time',
    header: 'Date & Time',
    cell: ({ row }) => {
      const dateTime = row.getValue('date_time') as string;
      return (
        <div className="flex flex-col gap-1">
          <div className="text-sm text-gray-900">{formatDateTime(dateTime)}</div>
          <div className="flex items-center gap-1 text-xs text-gray-500">
            <Clock className="h-3 w-3" />
            {getTimeRemaining(dateTime)}
          </div>
        </div>
      );
    },
  },
  {
    accessorKey: 'phone_number',
    header: 'Phone Number',
    cell: ({ row }) => {
      const phone = row.getValue('phone_number') as string;
      return (
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Phone className="h-4 w-4" />
          {maskPhoneNumber(phone)}
        </div>
      );
    },
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => {
      const status = row.getValue('status') as Reminder['status'];
      return <StatusBadge status={status} />;
    },
  },
];

interface RemindersTableProps {
  reminders: Reminder[];
}

export function RemindersTable({ reminders }: RemindersTableProps) {
  const [sorting, setSorting] = useState<SortingState>([
    {
      id: 'date_time',
      desc: false, // Ascending to show soonest first
    },
  ]);

  const table = useReactTable({
    data: reminders,
    columns,
    state: {
      sorting,
    },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  if (reminders.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-gray-300 p-12 text-center">
        <p className="text-gray-500">No reminders found</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-white">
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <TableHead key={header.id}>
                  {header.isPlaceholder
                    ? null
                    : flexRender(header.column.columnDef.header, header.getContext())}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows.map((row) => (
            <TableRow key={row.id}>
              {row.getVisibleCells().map((cell) => (
                <TableCell key={cell.id}>
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
