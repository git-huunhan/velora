import { useEffect, useState } from "react";

import type { CreateUserDto, User } from "./types";

import {
  createUser,
  deleteUser,
  getUsers,
  updateUser,
} from "@/features/users/api/usersApi";

export function useUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    getUsers()
      .then(setUsers)
      .catch(() => setError("Failed to load users"))
      .finally(() => setLoading(false));
  }, []);

  const addUser = async (data: CreateUserDto) => {
    try {
      console.log("ADD USER");

      setError(null);
      setIsSubmitting(true);

      const newUser = await createUser(data);

      setUsers((prev) => [...prev, newUser]);
    } catch {
      setError("Failed to create user");
      throw new Error("Failed to create user");
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateUserById = async (id: string, data: CreateUserDto) => {
    try {
      setError(null);
      setIsSubmitting(true);

      const updatedUser = await updateUser(id, data);

      setUsers((prev) =>
        prev.map((user) => (user.id === id ? updatedUser : user)),
      );
    } catch {
      setError("Failed to update user");
      throw new Error("Failed to update user");
    } finally {
      setIsSubmitting(false);
    }
  };

  const deleteUserById = async (id: string) => {
    try {
      setError(null);
      setIsSubmitting(true);

      await deleteUser(id);

      setUsers((prev) => prev.filter((user) => user.id !== id));
    } catch {
      setError("Failed to delete user");
      throw new Error("Failed to delete user");
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    users,
    loading,
    error,
    isSubmitting,
    addUser,
    updateUserById,
    deleteUserById,
  };
}
