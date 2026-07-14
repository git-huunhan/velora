import type { User } from "./AuthContext";

const USER_AVATAR_COLORS = [
  "10b981",
  "3b82f6",
  "f59e0b",
  "8b5cf6",
  "ef4444",
  "06b6d4",
  "ec4899",
  "84cc16",
  "14b8a6",
  "6366f1",
  "f97316",
  "a855f7",
  "0ea5e9",
  "2563eb",
  "e11d48",
  "f97316",
  "0891b2",
  "7c3aed",
  "ea580c",
  "16a34a",
];

const USER_AVATAR_COLOR_OVERRIDES: Record<string, string> = {
  "admin pro": "10b981",
};

function getStableIndex(value: string, size: number) {
  let hash = 0;
  for (const char of value) {
    hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  }
  return hash % size;
}

export function getUserInitials(name?: string | null) {
  const words = name?.trim().split(/\s+/).filter(Boolean) ?? [];
  if (words.length === 0) return "?";
  return words
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase() ?? "")
    .join("");
}

export function getUserAvatarColor(name?: string | null) {
  const normalizedName = name?.trim().toLowerCase() ?? "";
  if (USER_AVATAR_COLOR_OVERRIDES[normalizedName]) {
    return USER_AVATAR_COLOR_OVERRIDES[normalizedName];
  }

  const initials = getUserInitials(name).toLowerCase();
  if (!initials || initials === "?") return USER_AVATAR_COLORS[0];
  return USER_AVATAR_COLORS[
    getStableIndex(initials, USER_AVATAR_COLORS.length)
  ];
}

export function getUserAvatarUrl(user?: Pick<User, "name"> | null) {
  if (!user?.name) return "";
  const name = user.name.trim();
  const backgroundColor = getUserAvatarColor(name);
  return `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(
    name,
  )}&backgroundColor=${backgroundColor}&textColor=ffffff&backgroundType=solid`;
}
