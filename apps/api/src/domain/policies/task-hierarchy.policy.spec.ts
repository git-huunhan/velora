import { TaskType } from '../contracts/enums';
import {
  type HierarchyTask,
  validateParentAssignment,
  validateTaskDeletion,
} from './task-hierarchy.policy';

const projectId = 'project-1';
const tasks: HierarchyTask[] = [
  { id: 'epic', parentId: null, projectId, type: TaskType.EPIC },
  { id: 'task', parentId: 'epic', projectId, type: TaskType.TASK },
  { id: 'bug', parentId: null, projectId, type: TaskType.BUG },
  { id: 'subtask', parentId: 'task', projectId, type: TaskType.SUBTASK },
];

describe('task hierarchy policy', () => {
  it('supports Epic -> Task/Bug -> Subtask', () => {
    expect(validateParentAssignment(tasks[1], 'epic', tasks)).toEqual({
      valid: true,
    });
    expect(validateParentAssignment(tasks[3], 'bug', tasks)).toEqual({
      valid: true,
    });
  });

  it('requires every subtask to have a task or bug parent', () => {
    expect(validateParentAssignment(tasks[3], null, tasks)).toMatchObject({
      code: 'SUBTASK_PARENT_REQUIRED',
      valid: false,
    });
    expect(validateParentAssignment(tasks[3], 'epic', tasks)).toMatchObject({
      code: 'INVALID_SUBTASK_PARENT',
      valid: false,
    });
  });

  it('rejects cross-project parents and cycles', () => {
    const externalEpic: HierarchyTask = {
      id: 'external',
      parentId: null,
      projectId: 'project-2',
      type: TaskType.EPIC,
    };

    expect(
      validateParentAssignment(tasks[1], externalEpic.id, [
        ...tasks,
        externalEpic,
      ]),
    ).toMatchObject({ code: 'CROSS_PROJECT_PARENT', valid: false });
    expect(validateParentAssignment(tasks[0], 'subtask', tasks)).toMatchObject({
      code: 'HIERARCHY_CYCLE',
      valid: false,
    });
  });

  it('prevents deleting work items with children', () => {
    expect(validateTaskDeletion('task', tasks)).toMatchObject({
      code: 'WORK_ITEM_HAS_CHILDREN',
      valid: false,
    });
  });
});
