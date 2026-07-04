import { ProjectRole } from '../contracts/enums';
import {
  hasProjectPermission,
  ProjectPermission,
} from './project-permission.policy';

describe('project permission policy', () => {
  it('allows only owners to delete projects', () => {
    expect(
      hasProjectPermission(ProjectRole.OWNER, ProjectPermission.DELETE_PROJECT),
    ).toBe(true);
    expect(
      hasProjectPermission(ProjectRole.ADMIN, ProjectPermission.DELETE_PROJECT),
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
  });
});
