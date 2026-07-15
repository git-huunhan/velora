interface Trend {
  value: number;
  isPositive: boolean;
}

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: Trend;
  isLoading?: boolean;
}

export function StatsCard({
  title,
  value,
  icon,
  trend,
  isLoading,
}: StatsCardProps) {
  if (isLoading) {
    return (
      <div className="rounded-xl border bg-card text-card-foreground shadow p-6 flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <span className="h-5 w-24 bg-muted animate-pulse rounded" />
          <span className="h-5 w-5 bg-muted animate-pulse rounded" />
        </div>
        <div className="text-2xl font-bold text-foreground mt-2">
          <span className="animate-pulse bg-muted h-8 w-16 rounded block" />
        </div>
        {trend && (
          <div className="h-4 w-32 bg-muted animate-pulse rounded mt-1" />
        )}
      </div>
    );
  }

  return (
    <div className="rounded-xl border bg-card text-card-foreground shadow p-6 flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-muted-foreground tracking-tight">
          {title}
        </span>
        <span className="text-muted-foreground">{icon}</span>
      </div>

      <div className="text-2xl font-bold text-foreground mt-2">
        {isLoading ? (
          <span className="animate-pulse bg-muted h-8 w-16 rounded block" />
        ) : (
          value
        )}
      </div>

      {trend && (
        <div
          className={`flex items-center text-xs font-medium mt-1 ${trend.isPositive ? "text-green-600" : "text-red-600"}`}
        >
          {trend.isPositive ? "↑" : "↓"} {Math.abs(trend.value)}%
          <span className="text-muted-foreground font-normal ml-1">
            vs last month
          </span>
        </div>
      )}
    </div>
  );
}
