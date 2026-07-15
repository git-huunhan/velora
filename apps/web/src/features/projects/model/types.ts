export type ProjectStatus = "planning" | "active" | "completed";
export type ProjectMemberRole = "admin" | "member" | "viewer";

export interface ProjectCapabilities {
  canCreateWorkItems: boolean;
  canDeleteProject: boolean;
  canDeleteWorkItems: boolean;
  canManageMembers: boolean;
  canManageWorkflow: boolean;
  canReadProject: boolean;
  canReadWorkItems: boolean;
  canUpdateProject: boolean;
  canUpdateWorkItems: boolean;
}

export interface ProjectMember {
  userId: string;
  name: string;
  avatarUrl?: string;
  role: ProjectMemberRole;
  capabilities: ProjectCapabilities;
  affectedAssignedTaskCount: number;
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
