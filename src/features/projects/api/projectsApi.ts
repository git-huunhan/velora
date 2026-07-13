import { apiRequest } from "@/shared/api/client";

import type {
  PaginatedProjects,
  Project,
  ProjectMember,
  ProjectMemberRole,
  ProjectStatus,
} from "../model/types";
import type { ProjectFormData } from "../ui/ProjectForm/ProjectForm";

interface ApiProject {
  archivedAt: string | null;
  avatarUrl: string | null;
  createdAt: string;
  description: string;
  endDate: string | null;
  id: string;
  key: string;
  name: string;
  startDate: string | null;
  status: ProjectStatus;
  updatedAt: string;
}

interface ApiProjectList {
  data: ApiProject[];
  meta: {
    limit: number;
    page: number;
    total: number;
    totalPages: number;
  };
}

interface ApiProjectMember {
  role: ProjectMemberRole;
  user: {
    avatarUrl: string | null;
    id: string;
    name: string;
  };
}

interface ApiProjectMemberList {
  data: ApiProjectMember[];
}

type ProjectMutationData = Partial<Omit<Project, "id" | "createdAt">>;

const AVATAR_URL_PREFIX = "https://velora.local/space-avatar/";
const projectKeyCache = new Map<string, string>();

function avatarIdToUrl(avatar?: string | null) {
  return avatar ? `${AVATAR_URL_PREFIX}${avatar}` : null;
}

function avatarUrlToId(avatarUrl?: string | null) {
  if (!avatarUrl?.startsWith(AVATAR_URL_PREFIX)) return undefined;
  return avatarUrl.slice(AVATAR_URL_PREFIX.length);
}

function dateOnly(value?: string | null) {
  return value ? value.slice(0, 10) : "";
}

function toProjectMember(member: ApiProjectMember): ProjectMember {
  return {
    avatarUrl: member.user.avatarUrl ?? undefined,
    name: member.user.name,
    role: member.role,
    userId: member.user.id,
  };
}

function toProject(
  apiProject: ApiProject,
  members: ProjectMember[] = [],
): Project {
  const project: Project = {
    archivedAt: apiProject.archivedAt ?? undefined,
    avatar: avatarUrlToId(apiProject.avatarUrl),
    description: apiProject.description,
    endDate: dateOnly(apiProject.endDate),
    id: apiProject.id,
    key: apiProject.key,
    memberIds: members.map((member) => member.userId),
    members,
    name: apiProject.name,
    startDate: dateOnly(apiProject.startDate),
    status: apiProject.status,
  };
  projectKeyCache.set(project.id, project.key);
  return project;
}

function toProjectUpdatePayload(data: ProjectMutationData) {
  return {
    avatarUrl:
      data.avatar !== undefined ? avatarIdToUrl(data.avatar) : undefined,
    description: data.description,
    endDate: data.endDate ? new Date(data.endDate).toISOString() : undefined,
    name: data.name,
    startDate: data.startDate
      ? new Date(data.startDate).toISOString()
      : undefined,
    status: data.status,
  };
}

export async function getProjects(
  page: number = 1,
  limit: number = 5,
  status?: string,
): Promise<PaginatedProjects> {
  const search = new URLSearchParams({
    limit: String(limit),
    page: String(page),
    sort: "createdAt:desc",
  });

  if (status && status !== "all") {
    search.set("status", status);
  }

  const response = await apiRequest<ApiProjectList>(`/projects?${search}`);
  return {
    data: response.data.map((project) => toProject(project)),
    totalCount: response.meta.total,
    totalPages: response.meta.totalPages,
  };
}

export async function getProjectById(id: string): Promise<Project> {
  const [project, members] = await Promise.all([
    apiRequest<ApiProject>(`/projects/${id}`),
    apiRequest<ApiProjectMemberList>(`/projects/${id}/members`),
  ]);

  return toProject(project, members.data.map(toProjectMember));
}

export function getProjectKeySync(id: string): string {
  return projectKeyCache.get(id) ?? "TASK";
}

export async function createProject(data: ProjectFormData): Promise<Project> {
  const created = await apiRequest<ApiProject>("/projects", {
    body: JSON.stringify({
      description: data.description || "",
      key: data.key.trim().toUpperCase(),
      name: data.name.trim(),
    }),
    method: "POST",
  });

  const needsPatch =
    data.status !== "active" || !!data.startDate || !!data.endDate;
  if (!needsPatch) return toProject(created);

  return updateProject(created.id, {
    endDate: data.endDate,
    startDate: data.startDate,
    status: data.status,
  });
}

export async function updateProject(
  id: string,
  data: ProjectMutationData,
): Promise<Project> {
  return toProject(
    await apiRequest<ApiProject>(`/projects/${id}`, {
      body: JSON.stringify(toProjectUpdatePayload(data)),
      method: "PATCH",
    }),
  );
}

export async function archiveProject(id: string): Promise<void> {
  await apiRequest<ApiProject>(`/projects/${id}/archive`, {
    method: "POST",
  });
}

export async function restoreProject(id: string): Promise<Project> {
  return toProject(
    await apiRequest<ApiProject>(`/projects/${id}/unarchive`, {
      method: "POST",
    }),
  );
}

export async function addProjectMember(
  projectId: string,
  userId: string,
): Promise<void> {
  await apiRequest(`/projects/${projectId}/members`, {
    body: JSON.stringify({ role: "member", userId }),
    method: "POST",
  });
}

export async function removeProjectMember(
  projectId: string,
  userId: string,
): Promise<void> {
  await apiRequest(`/projects/${projectId}/members/${userId}`, {
    method: "DELETE",
  });
}
