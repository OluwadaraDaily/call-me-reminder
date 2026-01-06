import { Card, CardContent, CardHeader } from '@/components/ui/card';

export function RemindersTableSkeleton() {
  return (
    <div className="space-y-4">
      <div className="h-7 w-48 bg-gray-200 rounded animate-pulse" />

      <Card>
        <CardHeader className="border-b border-gray-200 pb-4">
          <div className="flex items-center justify-between">
            <div className="h-5 w-32 bg-gray-200 rounded animate-pulse" />
            <div className="flex gap-2">
              <div className="h-9 w-24 bg-gray-200 rounded animate-pulse" />
              <div className="h-9 w-24 bg-gray-200 rounded animate-pulse" />
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <div className="divide-y divide-gray-200">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex-1 space-y-2">
                    <div className="h-5 w-3/4 bg-gray-200 rounded animate-pulse" />
                    <div className="h-4 w-1/2 bg-gray-200 rounded animate-pulse" />
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="h-6 w-20 bg-gray-200 rounded-full animate-pulse" />
                    <div className="h-8 w-8 bg-gray-200 rounded animate-pulse" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>

        <div className="border-t border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div className="h-4 w-32 bg-gray-200 rounded animate-pulse" />
            <div className="flex items-center gap-2">
              <div className="h-9 w-20 bg-gray-200 rounded animate-pulse" />
              <div className="h-9 w-9 bg-gray-200 rounded animate-pulse" />
              <div className="h-9 w-9 bg-gray-200 rounded animate-pulse" />
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
