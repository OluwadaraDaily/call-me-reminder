'use client';

import { useAuth } from '@/hooks/useAuth';
import { useReminders, useCreateReminder } from '@/hooks/useReminders';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, Plus, Bell } from 'lucide-react';
import { RemindersTable } from '@/components/reminders-table';
import { StatsCardSkeleton } from '@/components/skeletons/stats-card-skeleton';
import { RemindersTableSkeleton } from '@/components/skeletons/reminders-table-skeleton';
import { AddReminderModal } from '@/components/add-reminder-modal';
import { ReminderCreate } from '@/types/reminder';
import { toast } from 'sonner';
import { useState } from 'react';

export default function DashboardPage() {
  const { user } = useAuth();
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const skip = (currentPage - 1) * pageSize;
  const { data: paginatedData, isLoading, error } = useReminders(skip, pageSize);
  const createReminder = useCreateReminder();

  const reminders = paginatedData?.items || [];
  const totalCount = paginatedData?.total || 0;

  const scheduledCount = reminders.filter(r => r.status === 'scheduled').length;
  const completedCount = reminders.filter(r => r.status === 'completed').length;

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handlePageSizeChange = (newPageSize: number) => {
    setPageSize(newPageSize);
    setCurrentPage(1); // Reset to first page when changing page size
  };

  const handleCreateReminder = async (data: ReminderCreate) => {
    try {
      await createReminder.mutateAsync(data);
      toast.success('Reminder created successfully!');
    } catch (error) {
      toast.error('Failed to create reminder. Please try again.');
      throw error;
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-black">Dashboard</h1>
            <p className="mt-2 text-gray-600">Welcome back, {user?.email}</p>
          </div>
          <div className="h-10 w-36 bg-gray-200 rounded animate-pulse" />
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <StatsCardSkeleton />
          <StatsCardSkeleton />
          <StatsCardSkeleton />
        </div>

        <RemindersTableSkeleton />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-black">Dashboard</h1>
            <p className="mt-2 text-gray-600">Welcome back, {user?.email}</p>
          </div>
        </div>
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-red-500">Failed to load reminders. Please try again.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-black">Dashboard</h1>
          <p className="mt-2 text-gray-600">Welcome back, {user?.email}</p>
        </div>
        <Button size="lg" className="bg-black hover:bg-gray-800" onClick={() => setIsModalOpen(true)}>
          <Plus className="mr-2 h-5 w-5" />
          New Reminder
        </Button>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Reminders</CardTitle>
            <Bell className="h-4 w-4 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalCount}</div>
            <p className="text-xs text-gray-600">{totalCount === 0 ? 'No reminders yet' : `${totalCount} total`}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Upcoming</CardTitle>
            <Calendar className="h-4 w-4 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{scheduledCount}</div>
            <p className="text-xs text-gray-600">Scheduled reminders</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <Bell className="h-4 w-4 text-black" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completedCount}</div>
            <p className="text-xs text-gray-600">Successful calls</p>
          </CardContent>
        </Card>
      </div>

      {totalCount === 0 ? (
        <Card className="border-dashed border-2">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-gray-100">
              <Calendar className="h-10 w-10 text-black" />
            </div>
            <CardTitle>No reminders yet</CardTitle>
            <CardDescription className="mt-2">
              Get started by creating your first reminder. Schedule a call and never miss important events again.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center pb-8">
            <Button size="lg" className="bg-black hover:bg-gray-800" onClick={() => setIsModalOpen(true)}>
              <Plus className="mr-2 h-5 w-5" />
              Create Your First Reminder
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-gray-900">Upcoming Reminders</h2>
          <RemindersTable
            reminders={reminders}
            totalCount={totalCount}
            currentPage={currentPage}
            pageSize={pageSize}
            onPageChange={handlePageChange}
            onPageSizeChange={handlePageSizeChange}
          />
        </div>
      )}

      <AddReminderModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        onSubmit={handleCreateReminder}
      />
    </div>
  );
}
