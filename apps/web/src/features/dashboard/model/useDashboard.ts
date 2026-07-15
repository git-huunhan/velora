import { useQuery } from "@tanstack/react-query";

import {
  getDashboardStats,
  getTasksByStatus,
  getTaskTrend,
  getWorkload,
} from "@/features/dashboard/api/dashboardApi";

export const dashboardKeys = {
  all: ["dashboard"] as const,
  stats: () => [...dashboardKeys.all, "stats"] as const,
  taskTrend: () => [...dashboardKeys.all, "taskTrend"] as const,
  tasksByStatus: () => [...dashboardKeys.all, "tasksByStatus"] as const,
  workload: () => [...dashboardKeys.all, "workload"] as const,
};

export function useDashboardStats() {
  return useQuery({
    queryKey: dashboardKeys.stats(),
    queryFn: getDashboardStats,
  });
}

export function useTaskTrend() {
  return useQuery({
    queryKey: dashboardKeys.taskTrend(),
    queryFn: getTaskTrend,
  });
}

export function useTasksByStatus() {
  return useQuery({
    queryKey: dashboardKeys.tasksByStatus(),
    queryFn: getTasksByStatus,
  });
}

export function useWorkload() {
  return useQuery({
    queryKey: dashboardKeys.workload(),
    queryFn: getWorkload,
  });
}
