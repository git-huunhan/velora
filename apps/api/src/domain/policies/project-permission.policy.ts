import { ProjectRole } from '../contracts/enums';

export enum ProjectPermission {
  READ_PROJECT = 'read_project',
  UPDATE_PROJECT = 'update_project',
  DELETE_PROJECT = 'delete_project',
  MANAGE_MEMBERS = 'manage_members',
  READ_WORK_ITEMS = 'read_work_items',
  CREATE_WORK_ITEMS = 'create_work_items',
  UPDATE_WORK_ITEMS = 'update_work_items',
  DELETE_WORK_ITEMS = 'delete_work_items',
  MANAGE_WORKFLOW = 'manage_workflow',
}

const rolePermissions: Record<ProjectRole, ReadonlySet<ProjectPermission>> = {
  [ProjectRole.ADMIN]: new Set(Object.values(ProjectPermission)),
  [ProjectRole.MEMBER]: new Set([
    ProjectPermission.READ_PROJECT,
    ProjectPermission.READ_WORK_ITEMS,
    ProjectPermission.CREATE_WORK_ITEMS,
    ProjectPermission.UPDATE_WORK_ITEMS,
  ]),
  [ProjectRole.VIEWER]: new Set([
    ProjectPermission.READ_PROJECT,
    ProjectPermission.READ_WORK_ITEMS,
  ]),
};

export function getProjectPermissions(
  role: ProjectRole,
): readonly ProjectPermission[] {
  return [...rolePermissions[role]];
}

export function hasProjectPermission(
  role: ProjectRole,
  permission: ProjectPermission,
): boolean {
  return rolePermissions[role].has(permission);
}
