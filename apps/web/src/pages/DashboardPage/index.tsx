import {
  StatsCard,
  TaskStatusChart,
  TaskTrendChart,
  WorkloadChart,
  useDashboardStats,
  useTaskTrend,
  useTasksByStatus,
  useWorkload,
} from "@/features/dashboard";
import { AlertTriangle, CheckCircle2, Folder, Zap } from "lucide-react";

export default function DashboardPage() {
  const {
    data: statsData,
    isLoading: isStatsLoading,
    isError: isStatsError,
  } = useDashboardStats();
  const { data: trendData, isLoading: isTrendLoading } = useTaskTrend();
  const { data: statusData, isLoading: isStatusLoading } = useTasksByStatus();
  const { data: workloadData, isLoading: isWorkloadLoading } = useWorkload();

  if (isStatsError)
    return <p className="dashboard__error">Failed to load dashboard data.</p>;

  const formatNumber = (n: number) => n.toLocaleString("en-US");

  return (
    <div className="h-full overflow-y-auto">
      <div className="flex flex-col gap-6 p-6 md:p-8">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatsCard
            isLoading={isStatsLoading}
            title="Total Projects"
            value={isStatsLoading ? "" : formatNumber(statsData!.totalProjects)}
            icon={<Folder className="h-5 w-5 text-indigo-500" />}
          />
          <StatsCard
            isLoading={isStatsLoading}
            title="Active Tasks"
            value={isStatsLoading ? "" : formatNumber(statsData!.activeTasks)}
            icon={<Zap className="h-5 w-5 text-amber-500" />}
            trend={{ value: 12.5, isPositive: true }}
          />
          <StatsCard
            isLoading={isStatsLoading}
            title="Completed Tasks"
            value={
              isStatsLoading ? "" : formatNumber(statsData!.completedTasks)
            }
            icon={<CheckCircle2 className="h-5 w-5 text-emerald-500" />}
            trend={{ value: 8.2, isPositive: true }}
          />
          <StatsCard
            isLoading={isStatsLoading}
            title="Overdue Tasks"
            value={isStatsLoading ? "" : formatNumber(statsData!.overdueTasks)}
            icon={<AlertTriangle className="h-5 w-5 text-rose-500" />}
            trend={{ value: 2.4, isPositive: false }}
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
          <div className="col-span-4">
            <TaskTrendChart data={trendData ?? []} isLoading={isTrendLoading} />
          </div>
          <div className="col-span-3">
            <TaskStatusChart
              data={statusData ?? []}
              isLoading={isStatusLoading}
            />
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
          <div className="col-span-7">
            <WorkloadChart
              data={workloadData ?? []}
              isLoading={isWorkloadLoading}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
