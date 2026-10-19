import { Skeleton } from "@siyahi/ui";

export default function SkeletonExample() {
  return (
    <div className="flex max-w-sm flex-col gap-2">
      <Skeleton className="h-4 w-32" />
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-4 w-full" />
    </div>
  );
}
