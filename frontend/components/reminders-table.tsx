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
import { Reminder } from '@/types/reminder';
import { StatusBadge } from './status-badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Clock, Phone, ChevronLeft, ChevronRight, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

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

interface ColumnsProps {
  onEdit: (reminder: Reminder) => void;
  onDelete: (reminder: Reminder) => void;
}

const createColumns = ({ onEdit, onDelete }: ColumnsProps): ColumnDef<Reminder>[] => [
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
  {
    id: 'actions',
    header: 'Actions',
    cell: ({ row }) => {
      const reminder = row.original;
      return (
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onEdit(reminder)}
            className="h-8 w-8 p-0"
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDelete(reminder)}
            className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      );
    },
  },
];

interface RemindersTableProps {
  reminders: Reminder[];
  totalCount?: number;
  currentPage?: number;
  pageSize?: number;
  onPageChange?: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
  onEdit: (reminder: Reminder) => void;
  onDelete: (reminder: Reminder) => void;
}

export function RemindersTable({
  reminders,
  totalCount = 0,
  currentPage = 1,
  pageSize = 10,
  onPageChange,
  onPageSizeChange,
  onEdit,
  onDelete,
}: RemindersTableProps) {
  const [sorting, setSorting] = useState<SortingState>([
    {
      id: 'date_time',
      desc: false, // Ascending to show soonest first
    },
  ]);

  const columns = createColumns({ onEdit, onDelete });

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

  const totalPages = Math.ceil(totalCount / pageSize);
  const startItem = totalCount === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalCount);

  const handlePreviousPage = () => {
    if (currentPage > 1 && onPageChange) {
      onPageChange(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages && onPageChange) {
      onPageChange(currentPage + 1);
    }
  };

  const handlePageSizeChange = (value: string) => {
    if (onPageSizeChange) {
      onPageSizeChange(Number(value));
    }
  };

  if (reminders.length === 0 && currentPage === 1) {
    return (
      <div className="rounded-lg border border-dashed border-gray-300 p-12 text-center">
        <p className="text-gray-500">No reminders found</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
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

      {totalCount > 0 && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <p className="text-sm text-gray-700">
              Showing <span className="font-medium">{startItem}</span> to{' '}
              <span className="font-medium">{endItem}</span> of{' '}
              <span className="font-medium">{totalCount}</span> results
            </p>
          </div>

          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <label htmlFor="page-size" className="text-sm text-gray-700">
                Rows per page
              </label>
              <Select value={String(pageSize)} onValueChange={handlePageSizeChange}>
                <SelectTrigger id="page-size" className="h-8 w-[70px]">
                  <SelectValue placeholder={String(pageSize)} />
                </SelectTrigger>
                <SelectContent side="top">
                  <SelectItem value="5">5</SelectItem>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="20">20</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                  <SelectItem value="100">100</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handlePreviousPage}
                disabled={currentPage <= 1}
                className="h-8 w-8 p-0"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <div className="text-sm text-gray-700">
                Page <span className="font-medium">{currentPage}</span> of{' '}
                <span className="font-medium">{totalPages}</span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleNextPage}
                disabled={currentPage >= totalPages}
                className="h-8 w-8 p-0"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
