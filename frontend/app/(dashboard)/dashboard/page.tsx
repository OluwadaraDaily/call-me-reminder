'use client';

import { useAuth } from '@/hooks/useAuth';
import { useReminders, useCreateReminder, useUpdateReminder, useDeleteReminder } from '@/hooks/useReminders';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar, Plus, Bell, Search } from 'lucide-react';
import { RemindersTable } from '@/components/reminders-table';
import { StatsCardSkeleton } from '@/components/skeletons/stats-card-skeleton';
import { RemindersTableSkeleton } from '@/components/skeletons/reminders-table-skeleton';
import { AddReminderModal } from '@/components/add-reminder-modal';
import { EditReminderModal } from '@/components/edit-reminder-modal';
import { DeleteReminderDialog } from '@/components/delete-reminder-dialog';
import { Reminder, ReminderCreate, ReminderUpdate } from '@/types/reminder';
import { toast } from 'sonner';
import { useState } from 'react';
import { useDebounce } from '@/hooks/useDebounce';

export default function DashboardPage() {
  const { user } = useAuth();
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedReminder, setSelectedReminder] = useState<Reminder | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearch = useDebounce(searchQuery, 500);

  const skip = (currentPage - 1) * pageSize;
  const filterStatus = statusFilter === 'all' ? undefined : statusFilter;
  const searchParam = debouncedSearch.trim() || undefined;

  // Check if any filters are active
  const hasActiveFilters = statusFilter !== 'all' || !!searchParam;

  // Get all reminders (unfiltered) for stats calculation - omit limit to fetch all
  const { data: allRemindersData, isLoading: isLoadingAll } = useReminders(0, undefined, undefined, undefined);
  const hasAnyReminders = (allRemindersData?.total || 0) > 0;

  // Calculate stats from ALL unfiltered reminders
  const allReminders = allRemindersData?.items || [];
  const totalReminderCount = allRemindersData?.total || 0;
  const scheduledCount = allReminders.filter(r => r.status === 'scheduled').length;
  const completedCount = allReminders.filter(r => r.status === 'completed').length;

  // Get filtered reminders for the table
  const { data: paginatedData, isLoading: isLoadingFiltered, error } = useReminders(skip, pageSize, filterStatus, searchParam);
  const createReminder = useCreateReminder();
  const updateReminder = useUpdateReminder();
  const deleteReminder = useDeleteReminder();

  const reminders = paginatedData?.items || [];
  const filteredTotalCount = paginatedData?.total || 0;

  // Use combined loading state
  const isLoading = isLoadingAll || isLoadingFiltered;

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handlePageSizeChange = (newPageSize: number) => {
    setPageSize(newPageSize);
    setCurrentPage(1); // Reset to first page when changing page size
  };

  const handleStatusFilterChange = (value: string) => {
    setStatusFilter(value);
    setCurrentPage(1); // Reset to first page when changing filter
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1); // Reset to first page when searching
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

  const handleEditReminder = (reminder: Reminder) => {
    setSelectedReminder(reminder);
    setIsEditModalOpen(true);
  };

  const handleUpdateReminder = async (id: number, data: ReminderUpdate) => {
    try {
      await updateReminder.mutateAsync({ id, data });
      toast.success('Reminder updated successfully!');
    } catch (error) {
      toast.error('Failed to update reminder. Please try again.');
      throw error;
    }
  };

  const handleDeleteReminder = (reminder: Reminder) => {
    setSelectedReminder(reminder);
    setIsDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!selectedReminder) return;

    try {
      await deleteReminder.mutateAsync(selectedReminder.id);
      toast.success('Reminder deleted successfully!');
      setIsDeleteDialogOpen(false);
      setSelectedReminder(null);
    } catch (error) {
      toast.error('Failed to delete reminder. Please try again.');
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
            <div className="text-2xl font-bold">{totalReminderCount}</div>
            <p className="text-xs text-gray-600">{totalReminderCount === 0 ? 'No reminders yet' : `${totalReminderCount} total`}</p>
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

      {!hasAnyReminders ? (
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
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <h2 className="text-xl font-semibold text-gray-900">Reminders</h2>

            <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
              {/* Search Input */}
              <div className="relative flex-1 sm:w-64">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Search by title or message..."
                  value={searchQuery}
                  onChange={handleSearchChange}
                  className="pl-9"
                />
              </div>
            </div>
          </div>

          {/* Filter Tabs */}
          <Tabs value={statusFilter} onValueChange={handleStatusFilterChange}>
            <TabsList>
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="scheduled">Scheduled</TabsTrigger>
              <TabsTrigger value="completed">Completed</TabsTrigger>
              <TabsTrigger value="failed">Failed</TabsTrigger>
            </TabsList>
          </Tabs>

          {filteredTotalCount === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-gray-500">
                  {hasActiveFilters
                    ? 'No reminders match your current filters. Try adjusting your search or filter criteria.'
                    : 'No reminders found.'}
                </p>
              </CardContent>
            </Card>
          ) : (
            <RemindersTable
              reminders={reminders}
              totalCount={filteredTotalCount}
              currentPage={currentPage}
              pageSize={pageSize}
              onPageChange={handlePageChange}
              onPageSizeChange={handlePageSizeChange}
              onEdit={handleEditReminder}
              onDelete={handleDeleteReminder}
            />
          )}
        </div>
      )}

      <AddReminderModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        onSubmit={handleCreateReminder}
      />

      <EditReminderModal
        open={isEditModalOpen}
        onOpenChange={setIsEditModalOpen}
        reminder={selectedReminder}
        onSubmit={handleUpdateReminder}
      />

      <DeleteReminderDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        reminder={selectedReminder}
        onConfirm={handleConfirmDelete}
        isDeleting={deleteReminder.isPending}
      />
    </div>
  );
}
