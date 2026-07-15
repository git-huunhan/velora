import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

import { useUsers } from "@/features/users";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const projectSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters"),
  key: z.string().min(2, "Key must be at least 2 characters").max(5),
  description: z.string().optional(),
  status: z.enum(["planning", "active", "completed"] as const),
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().min(1, "End date is required"),
  memberIds: z.array(z.string()).min(1, "Select at least one member"),
});

export type ProjectFormData = z.infer<typeof projectSchema>;

interface ProjectFormProps {
  initialData?: Partial<ProjectFormData>;
  onSubmit: (data: ProjectFormData) => void;
  isLoading?: boolean;
}

export function ProjectForm({
  initialData,
  onSubmit,
  isLoading,
}: ProjectFormProps) {
  const { users, loading: usersLoading } = useUsers();

  const {
    register,
    handleSubmit,
    setValue,
    control,
    formState: { errors },
  } = useForm<ProjectFormData>({
    resolver: zodResolver(projectSchema),
    defaultValues: {
      name: initialData?.name || "",
      key: initialData?.key || "",
      description: initialData?.description || "",
      status: initialData?.status || "planning",
      startDate: initialData?.startDate || "",
      endDate: initialData?.endDate || "",
      memberIds: initialData?.memberIds || [],
    },
  });

  const selectedMembers = useWatch({
    control,
    name: "memberIds",
  });

  const toggleMember = (userId: string) => {
    const current = new Set(selectedMembers);
    if (current.has(userId)) {
      current.delete(userId);
    } else {
      current.add(userId);
    }
    setValue("memberIds", Array.from(current), { shouldValidate: true });
  };

  return (
    <form className="flex flex-col gap-4" onSubmit={handleSubmit(onSubmit)}>
      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-foreground">
            Project Name *
          </label>
          <Input {...register("name")} placeholder="e.g. Redesign Website" />
          {errors.name && (
            <span className="text-xs text-red-500">{errors.name.message}</span>
          )}
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-foreground">
            Project Key *
          </label>
          <Input
            {...register("key")}
            placeholder="e.g. RED"
            style={{ textTransform: "uppercase" }}
          />
          {errors.key && (
            <span className="text-xs text-red-500">{errors.key.message}</span>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-foreground">
          Description
        </label>
        <Textarea
          {...register("description")}
          rows={3}
          placeholder="Project details..."
        />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-foreground">
            Start Date *
          </label>
          <Input type="date" {...register("startDate")} />
          {errors.startDate && (
            <span className="text-xs text-red-500">
              {errors.startDate.message}
            </span>
          )}
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-foreground">
            End Date *
          </label>
          <Input type="date" {...register("endDate")} />
          {errors.endDate && (
            <span className="text-xs text-red-500">
              {errors.endDate.message}
            </span>
          )}
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-foreground">
            Status *
          </label>
          <Select
            defaultValue={initialData?.status || "planning"}
            onValueChange={(val) =>
              setValue("status", val as "planning" | "active" | "completed", {
                shouldValidate: true,
              })
            }
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent className="w-full">
              <SelectItem value="planning">Planning</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-foreground">
          Team Members *
        </label>
        {usersLoading ? (
          <p className="text-sm text-muted-foreground">Loading users...</p>
        ) : (
          <div className="grid grid-cols-2 gap-2 rounded-md border border-border p-3">
            {users.map((user) => (
              <label
                key={user.id}
                className="flex items-center gap-2 cursor-pointer text-sm"
              >
                <input
                  type="checkbox"
                  checked={selectedMembers.includes(user.id)}
                  onChange={() => toggleMember(user.id)}
                  className="rounded border-border"
                />
                {user.name}{" "}
                <span className="text-muted-foreground">({user.role})</span>
              </label>
            ))}
          </div>
        )}
        {errors.memberIds && (
          <span className="text-xs text-red-500">
            {errors.memberIds.message}
          </span>
        )}
      </div>

      <Button type="submit" disabled={isLoading} className="mt-2">
        {isLoading ? "Saving..." : "Save Project"}
      </Button>
    </form>
  );
}
