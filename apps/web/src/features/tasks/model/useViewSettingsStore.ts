import { create } from "zustand";

interface ViewSettingsState {
  showWorkType: boolean;
  setShowWorkType: (val: boolean) => void;
  showWorkItemKey: boolean;
  setShowWorkItemKey: (val: boolean) => void;
  showEpic: boolean;
  setShowEpic: (val: boolean) => void;
  showLabels: boolean;
  setShowLabels: (val: boolean) => void;
  showDueDate: boolean;
  setShowDueDate: (val: boolean) => void;
  showPriority: boolean;
  setShowPriority: (val: boolean) => void;
  showAssignee: boolean;
  setShowAssignee: (val: boolean) => void;
  showComment: boolean;
  setShowComment: (val: boolean) => void;
  showAttachment: boolean;
  setShowAttachment: (val: boolean) => void;
  expandAllCounter: number;
  collapseAllCounter: number;
  triggerExpandAll: () => void;
  triggerCollapseAll: () => void;
}

export const useViewSettingsStore = create<ViewSettingsState>((set) => ({
  showWorkType: true,
  setShowWorkType: (val) => set({ showWorkType: val }),
  showWorkItemKey: true,
  setShowWorkItemKey: (val) => set({ showWorkItemKey: val }),
  showEpic: true,
  setShowEpic: (val) => set({ showEpic: val }),
  showLabels: true,
  setShowLabels: (val) => set({ showLabels: val }),
  showDueDate: true,
  setShowDueDate: (val) => set({ showDueDate: val }),
  showPriority: true,
  setShowPriority: (val) => set({ showPriority: val }),
  showAssignee: true,
  setShowAssignee: (val) => set({ showAssignee: val }),
  showComment: true,
  setShowComment: (val) => set({ showComment: val }),
  showAttachment: true,
  setShowAttachment: (val) => set({ showAttachment: val }),
  expandAllCounter: 0,
  collapseAllCounter: 0,
  triggerExpandAll: () =>
    set((state) => ({ expandAllCounter: state.expandAllCounter + 1 })),
  triggerCollapseAll: () =>
    set((state) => ({ collapseAllCounter: state.collapseAllCounter + 1 })),
}));
