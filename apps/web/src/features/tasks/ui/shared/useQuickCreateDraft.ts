import { useState } from "react";

export type QuickCreateTaskType = "task" | "epic" | "bug";

export interface QuickCreateDraft {
  title: string;
  type: QuickCreateTaskType;
  assigneeId: string | null;
  dueDate: string | null;
}

const initialDraft: QuickCreateDraft = {
  title: "",
  type: "task",
  assigneeId: null,
  dueDate: null,
};

export function useQuickCreateDraft() {
  const [draft, setDraft] = useState<QuickCreateDraft>(initialDraft);

  const updateDraft = <Key extends keyof QuickCreateDraft>(
    key: Key,
    value: QuickCreateDraft[Key],
  ) => setDraft((current) => ({ ...current, [key]: value }));

  const resetDraft = () => setDraft(initialDraft);

  return { draft, updateDraft, resetDraft };
}
