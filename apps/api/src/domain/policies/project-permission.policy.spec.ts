import { ProjectRole } from '../contracts/enums';
import {
  getProjectPermissions,
  hasProjectPermission,
  ProjectPermission,
} from './project-permission.policy';

describe('project permission policy', () => {
  it('gives administrators the full project permission set', () => {
    expect(getProjectPermissions(ProjectRole.ADMIN)).toEqual(
      expect.arrayContaining(Object.values(ProjectPermission)),
    );
    expect(
      hasProjectPermission(ProjectRole.ADMIN, ProjectPermission.DELETE_PROJECT),
    ).toBe(true);
  });

  it('keeps members focused on work item collaboration', () => {
    expect(
      hasProjectPermission(
        ProjectRole.MEMBER,
        ProjectPermission.CREATE_WORK_ITEMS,
      ),
    ).toBe(true);
    expect(
      hasProjectPermission(
        ProjectRole.MEMBER,
        ProjectPermission.UPDATE_WORK_ITEMS,
      ),
    ).toBe(true);
    expect(
      hasProjectPermission(
        ProjectRole.MEMBER,
        ProjectPermission.MANAGE_MEMBERS,
      ),
    ).toBe(false);
    expect(
      hasProjectPermission(
        ProjectRole.MEMBER,
        ProjectPermission.MANAGE_WORKFLOW,
      ),
    ).toBe(false);
  });

  it('keeps viewers read-only', () => {
    expect(
      hasProjectPermission(
        ProjectRole.VIEWER,
        ProjectPermission.READ_WORK_ITEMS,
      ),
    ).toBe(true);
    expect(
      hasProjectPermission(
        ProjectRole.VIEWER,
        ProjectPermission.UPDATE_WORK_ITEMS,
      ),
    ).toBe(false);
    expect(
      hasProjectPermission(
        ProjectRole.VIEWER,
        ProjectPermission.CREATE_WORK_ITEMS,
      ),
    ).toBe(false);
  });
});
