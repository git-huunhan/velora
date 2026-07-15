import { create } from "zustand";

interface SidebarStore {
  isMobileOpen: boolean;
  isDesktopClosed: boolean;
  toggleMobile: () => void;
  toggleDesktop: () => void;
  closeMobile: () => void;
}

export const useSidebar = create<SidebarStore>((set) => ({
  isMobileOpen: false,
  isDesktopClosed: false,
  toggleMobile: () => set((s) => ({ isMobileOpen: !s.isMobileOpen })),
  toggleDesktop: () => set((s) => ({ isDesktopClosed: !s.isDesktopClosed })),
  closeMobile: () => set({ isMobileOpen: false }),
}));
