export interface DashboardStats {
  totalProjects: number;
  activeTasks: number;
  completedTasks: number;
  overdueTasks: number;
}

export interface TaskTrendPoint {
  date: string;
  created: number;
  completed: number;
}

export interface TaskStatusData {
  name: string;
  value: number;
}

export interface WorkloadData {
  name: string;
  tasks: number;
}
