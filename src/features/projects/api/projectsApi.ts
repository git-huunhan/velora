import type { PaginatedProjects, Project } from "../model/types";
import type { ProjectFormData } from "../ui/ProjectForm/ProjectForm";

let projectsDb: Project[] = Array.from({ length: 24 }).map((_, i) => {
  return {
    id: `proj-${i + 1}`,
    name: `Project ${i + 1}`,
    key: `PRJ${i + 1}`,
    description: `This is the detailed description for Project ${i + 1}`,
    status: i % 3 === 0 ? "completed" : i % 2 === 0 ? "planning" : "active",
    startDate: "2024-01-01",
    endDate: "2024-12-31",
    memberIds: ["1", "2"],
    avatar: ((i % 24) + 1).toString(),
  };
});

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function getProjects(
  page: number = 1,
  limit: number = 5,
  status?: string,
): Promise<PaginatedProjects> {
  await delay(600);

  let filtered = projectsDb.filter((project) => !project.archivedAt);
  if (status === "archived") {
    filtered = projectsDb.filter((project) => !!project.archivedAt);
  } else if (status && status !== "all") {
    filtered = filtered.filter((p) => p.status === status);
  }

  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;
  const paginatedData = filtered.slice(startIndex, endIndex);

  return {
    data: paginatedData,
    totalCount: filtered.length,
    totalPages: Math.ceil(filtered.length / limit),
  };
}

export async function getProjectById(id: string): Promise<Project> {
  await delay(400);
  const project = projectsDb.find((p) => p.id === id);
  if (!project) throw new Error("Project not found");
  return { ...project };
}

export function getProjectKeySync(id: string): string {
  const project = projectsDb.find((p) => p.id === id);
  return project ? project.key : "TASK";
}

export async function createProject(data: ProjectFormData): Promise<Project> {
  await delay(600);

  const newProject: Project = {
    ...data,
    description: data.description || "",
    id: `proj-${Date.now()}`,
  };

  projectsDb = [newProject, ...projectsDb];
  return newProject;
}

export async function updateProject(
  id: string,
  data: Partial<Omit<Project, "id" | "createdAt">>,
): Promise<Project> {
  await delay(400);
  const index = projectsDb.findIndex((p) => p.id === id);
  if (index === -1) throw new Error("Project not found");

  const updatedProject = { ...projectsDb[index], ...data };
  projectsDb = [
    ...projectsDb.slice(0, index),
    updatedProject,
    ...projectsDb.slice(index + 1),
  ];

  return updatedProject;
}

export async function deleteProject(id: string): Promise<void> {
  await delay(400);
  projectsDb = projectsDb.filter((p) => p.id !== id);
}
