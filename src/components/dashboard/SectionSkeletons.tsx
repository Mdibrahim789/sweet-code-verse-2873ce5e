import { Skeleton } from '@/components/ui/skeleton';
import { Card } from '@/components/ui/card';

// Generic card skeleton
export const CardSkeleton = ({ lines = 2 }: { lines?: number }) => (
  <Card className="p-4 space-y-3">
    <Skeleton className="h-5 w-3/4" />
    {Array.from({ length: lines - 1 }).map((_, i) => (
      <Skeleton key={i} className="h-4 w-1/2" />
    ))}
  </Card>
);

// List of card skeletons
export const CardListSkeleton = ({ count = 3, lines = 2 }: { count?: number; lines?: number }) => (
  <div className="space-y-3">
    {Array.from({ length: count }).map((_, i) => (
      <CardSkeleton key={i} lines={lines} />
    ))}
  </div>
);

// Student card skeleton
export const StudentCardSkeleton = () => (
  <Card className="p-4 flex items-center gap-4">
    <Skeleton className="w-8 h-8 rounded-full" />
    <Skeleton className="w-12 h-12 rounded-full" />
    <div className="flex-1 space-y-2">
      <Skeleton className="h-5 w-1/3" />
      <Skeleton className="h-4 w-2/3" />
    </div>
  </Card>
);

export const StudentListSkeleton = ({ count = 5 }: { count?: number }) => (
  <div className="space-y-3">
    <Skeleton className="h-10 w-full rounded-md" /> {/* Search bar */}
    {Array.from({ length: count }).map((_, i) => (
      <StudentCardSkeleton key={i} />
    ))}
  </div>
);

// Faculty card skeleton
export const FacultyCardSkeleton = () => (
  <Card className="p-5 flex gap-4">
    <Skeleton className="w-24 h-28 rounded-lg shrink-0" />
    <div className="flex-1 space-y-2">
      <Skeleton className="h-5 w-1/3" />
      <Skeleton className="h-4 w-1/4" />
      <Skeleton className="h-4 w-1/2" />
      <Skeleton className="h-4 w-2/5" />
    </div>
  </Card>
);

export const FacultyListSkeleton = () => (
  <div className="space-y-6">
    {[1, 2, 3].map(group => (
      <div key={group} className="space-y-4">
        <Skeleton className="h-6 w-32" />
        <div className="grid gap-4 md:grid-cols-2">
          <FacultyCardSkeleton />
          <FacultyCardSkeleton />
        </div>
      </div>
    ))}
  </div>
);

// Gallery grid skeleton
export const GalleryGridSkeleton = ({ count = 8 }: { count?: number }) => (
  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
    {Array.from({ length: count }).map((_, i) => (
      <Skeleton key={i} className="aspect-square rounded-xl" />
    ))}
  </div>
);

// Routine table skeleton
export const RoutineTableSkeleton = () => (
  <Card className="p-4 space-y-3">
    <Skeleton className="h-6 w-40 mb-4" />
    {Array.from({ length: 4 }).map((_, i) => (
      <div key={i} className="flex gap-4">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-4 w-20" />
      </div>
    ))}
  </Card>
);

// Poll skeleton
export const PollSkeleton = () => (
  <Card className="p-5 space-y-4">
    <Skeleton className="h-6 w-3/4" />
    <div className="space-y-3">
      {[1, 2, 3].map(i => (
        <div key={i} className="p-3 rounded-lg border border-border space-y-2">
          <div className="flex justify-between">
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-4 w-16" />
          </div>
          <Skeleton className="h-2 w-full rounded-full" />
        </div>
      ))}
    </div>
  </Card>
);

// Bus schedule skeleton
export const BusScheduleSkeleton = () => (
  <div className="space-y-6">
    <div className="flex items-center justify-between">
      <div className="space-y-2">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-32" />
      </div>
    </div>
    <Skeleton className="h-10 w-full rounded-md" />
    <div className="space-y-4">
      {[1, 2].map(i => (
        <Card key={i} className="p-4 space-y-3">
          <Skeleton className="h-5 w-24" />
          {[1, 2, 3].map(j => (
            <div key={j} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-3">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-6 w-24 rounded-full" />
              </div>
            </div>
          ))}
        </Card>
      ))}
    </div>
  </div>
);

// Home section skeleton (combined)
export const HomeSectionSkeleton = () => (
  <div className="space-y-6">
    {/* Exam countdown */}
    <Skeleton className="h-32 w-full rounded-xl" />
    {/* Routine tables */}
    <RoutineTableSkeleton />
    <RoutineTableSkeleton />
    {/* Notice card */}
    <CardSkeleton lines={3} />
    {/* Poll card */}
    <PollSkeleton />
  </div>
);

// Attendance skeleton
export const AttendanceSkeleton = () => (
  <div className="space-y-3">
    <Skeleton className="h-6 w-32 mb-4" />
    {Array.from({ length: 3 }).map((_, i) => (
      <Card key={i} className="p-4 space-y-2">
        <div className="flex justify-between items-center">
          <div className="space-y-2">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-3 w-20" />
          </div>
          <Skeleton className="h-8 w-16 rounded-md" />
        </div>
      </Card>
    ))}
  </div>
);

// Academic section skeleton
export const AcademicSkeleton = () => (
  <div className="space-y-8">
    <div>
      <Skeleton className="h-6 w-32 mb-3" />
      <CardListSkeleton count={3} lines={1} />
    </div>
    <div>
      <Skeleton className="h-6 w-32 mb-3" />
      <CardListSkeleton count={2} lines={1} />
    </div>
    <div>
      <Skeleton className="h-6 w-40 mb-3" />
      <CardListSkeleton count={2} lines={2} />
    </div>
  </div>
);
