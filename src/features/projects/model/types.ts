export type ProjectStatus = "planning" | "active" | "completed";
export type ProjectMemberRole = "owner" | "admin" | "member" | "viewer";

export interface ProjectMember {
  userId: string;
  name: string;
  avatarUrl?: string;
  role: ProjectMemberRole;
}

export interface Project {
  id: string;
  name: string;
  key: string;
  description: string;
  status: ProjectStatus;
  startDate: string;
  endDate: string;
  memberIds: string[];
  members?: ProjectMember[];
  avatar?: string;
  archivedAt?: string;
}

export interface PaginatedProjects {
  data: Project[];
  totalCount: number;
  totalPages: number;
}
