import type { CreateUserDto, User } from "@/features/users";

import { apiRequest } from "@/shared/api/client";

interface ApiUser {
  avatarUrl: string | null;
  email: string;
  id: string;
  name: string;
}

interface ApiUserListResponse {
  data: ApiUser[];
}

function mapUser(user: ApiUser): User {
  return {
    avatarUrl: user.avatarUrl ?? undefined,
    email: user.email,
    id: user.id,
    name: user.name,
    role: user.email === "admin@velora.local" ? "admin" : "user",
  };
}

export async function getUsers(): Promise<User[]> {
  const params = new URLSearchParams({
    limit: "100",
    page: "1",
    sort: "name:asc",
  });
  const response = await apiRequest<ApiUserListResponse>(
    `/users?${params.toString()}`,
  );

  return response.data.map(mapUser);
}

export async function createUser(data: CreateUserDto): Promise<User> {
  void data;
  throw new Error("User creation is not available from the API yet.");
}

export async function updateUser(
  id: string,
  data: CreateUserDto,
): Promise<User> {
  void id;
  void data;
  throw new Error("User updates are not available from the API yet.");
}

export async function deleteUser(id: string): Promise<void> {
  void id;
  throw new Error("User deletion is not available from the API yet.");
}
