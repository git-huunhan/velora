export type ProjectStatus = "planning" | "active" | "completed";

export interface Project {
  id: string;
  name: string;
  key: string;
  description: string;
  status: ProjectStatus;
  startDate: string;
  endDate: string;
  memberIds: string[];
  avatar?: string;
  archivedAt?: string;
}

export interface PaginatedProjects {
  data: Project[];
  totalCount: number;
  totalPages: number;
}
