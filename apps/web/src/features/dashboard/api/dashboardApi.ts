import type {
  DashboardStats,
  TaskStatusData,
  TaskTrendPoint,
  WorkloadData,
} from "@/features/dashboard";

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function getDashboardStats(): Promise<DashboardStats> {
  await delay(600);
  return {
    totalProjects: 12,
    activeTasks: 145,
    completedTasks: 328,
    overdueTasks: 14,
  };
}

export async function getTaskTrend(): Promise<TaskTrendPoint[]> {
  await delay(800);
  return [
    { date: "Mon", created: 12, completed: 8 },
    { date: "Tue", created: 15, completed: 10 },
    { date: "Wed", created: 8, completed: 14 },
    { date: "Thu", created: 20, completed: 18 },
    { date: "Fri", created: 10, completed: 25 },
    { date: "Sat", created: 2, completed: 5 },
    { date: "Sun", created: 0, completed: 2 },
  ];
}

export async function getTasksByStatus(): Promise<TaskStatusData[]> {
  await delay(500);
  return [
    { name: "To Do", value: 45 },
    { name: "In Progress", value: 30 },
    { name: "In Review", value: 15 },
    { name: "Done", value: 10 },
  ];
}

export async function getWorkload(): Promise<WorkloadData[]> {
  await delay(700);
  return [
    { name: "Alex", tasks: 12 },
    { name: "Sarah", tasks: 8 },
    { name: "Mike", tasks: 15 },
    { name: "Emma", tasks: 5 },
    { name: "John", tasks: 9 },
  ];
}
