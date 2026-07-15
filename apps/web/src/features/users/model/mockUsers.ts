import type { User } from "./types";

export const mockUsers: User[] = [
  {
    id: "user-1",
    name: "Admin Pro",
    email: "admin@example.com",
    role: "admin",
    avatarUrl:
      "https://api.dicebear.com/7.x/initials/svg?seed=Admin Pro&backgroundColor=10b981&textColor=ffffff",
  },
  {
    id: "user-2",
    name: "Jane Smith",
    email: "jane@example.com",
    role: "user",
    avatarUrl:
      "https://api.dicebear.com/7.x/initials/svg?seed=Jane Smith&backgroundColor=3b82f6&textColor=ffffff",
  },
  {
    id: "user-3",
    name: "Bob Dev",
    email: "bob@example.com",
    role: "user",
    avatarUrl:
      "https://api.dicebear.com/7.x/initials/svg?seed=Bob Dev&backgroundColor=f59e0b&textColor=ffffff",
  },
];
