import { Button } from "@/components/ui/button";
import type { User } from "@/features/users";

interface UserTableProps {
  users: User[];

  onEdit: (user: User) => void;
  onDelete: (id: string) => void;
}

export function UserTable({ users, onEdit, onDelete }: UserTableProps) {
  return (
    <table className="w-full text-sm text-left">
      <thead className="bg-muted border-b border-border">
        <tr>
          <th className="h-12 px-4 align-middle font-medium text-muted-foreground">
            Name
          </th>
          <th className="h-12 px-4 align-middle font-medium text-muted-foreground">
            Email
          </th>
          <th className="h-12 px-4 align-middle font-medium text-muted-foreground">
            Role
          </th>
          <th className="h-12 px-4 align-middle font-medium text-muted-foreground text-right">
            Actions
          </th>
        </tr>
      </thead>

      <tbody className="divide-y divide-border">
        {users.map((user) => (
          <tr key={user.id} className="hover:bg-muted/50 transition-colors">
            <td className="p-4 align-middle font-medium text-foreground">
              {user.name}
            </td>
            <td className="p-4 align-middle text-muted-foreground">
              {user.email}
            </td>
            <td className="p-4 align-middle">
              <span
                className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors ${user.role === "admin" ? "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300" : "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300"}`}
              >
                {user.role}
              </span>
            </td>
            <td className="p-4 align-middle text-right space-x-2">
              <Button variant="outline" size="sm" onClick={() => onEdit(user)}>
                Edit
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => onDelete(user.id)}
              >
                Delete
              </Button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
