import {
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

import type { TaskStatusData } from "@/features/dashboard";

const COLORS = {
  "To Do": "#8b5cf6", // violet-500  — planned, queued
  "In Progress": "#06b6d4", // cyan-500     — active, moving
  "In Review": "#0d9488", // teal-600     — almost done
  Done: "#10b981", // emerald-500  — primary, completed ✓
};

interface TaskStatusChartProps {
  data: TaskStatusData[];
  isLoading?: boolean;
}

export function TaskStatusChart({ data, isLoading }: TaskStatusChartProps) {
  if (isLoading) {
    return (
      <div className="rounded-xl border bg-card text-card-foreground shadow p-6 h-[360px] flex flex-col">
        <div className="h-6 w-32 animate-pulse rounded bg-muted mb-4" />
        <div className="flex-1 flex items-center justify-center">
          {/* Donut ring skeleton */}
          <div className="relative h-[200px] w-[200px]">
            <div className="h-full w-full animate-pulse rounded-full bg-muted" />
            <div className="absolute inset-[30px] rounded-full bg-card" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border bg-card text-card-foreground shadow p-6 h-[360px] flex flex-col">
      <h3 className="text-lg font-semibold leading-none tracking-tight mb-4">
        Tasks by Status
      </h3>

      <ResponsiveContainer width="100%" height={280}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={70}
            outerRadius={110}
            paddingAngle={4}
            dataKey="value"
          >
            {data.map((entry) => (
              <Cell
                key={entry.name}
                fill={COLORS[entry.name as keyof typeof COLORS] || "#cbd5e1"}
              />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              background: "var(--card)",
              border: "1px solid var(--border)",
              borderRadius: "8px",
              fontSize: "13px",
              color: "var(--card-foreground)",
            }}
          />
          <Legend wrapperStyle={{ fontSize: "13px" }} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
