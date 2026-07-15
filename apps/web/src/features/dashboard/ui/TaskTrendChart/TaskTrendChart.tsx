import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import type { TaskTrendPoint } from "@/features/dashboard";

interface TaskTrendChartProps {
  data: TaskTrendPoint[];
  isLoading?: boolean;
}

export function TaskTrendChart({ data, isLoading }: TaskTrendChartProps) {
  if (isLoading) {
    return (
      <div className="rounded-xl border bg-card text-card-foreground shadow p-6 h-[360px] flex flex-col">
        <div className="h-6 w-48 animate-pulse rounded bg-muted mb-4" />
        <div className="flex-1 animate-pulse rounded bg-muted" />
      </div>
    );
  }

  return (
    <div className="rounded-xl border bg-card text-card-foreground shadow p-6 h-[360px] flex flex-col">
      <h3 className="text-lg font-semibold leading-none tracking-tight mb-4">
        Tasks Created vs Completed
      </h3>

      <ResponsiveContainer width="100%" height={280}>
        <AreaChart data={data}>
          <defs>
            <linearGradient id="gradCreated" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#6b7280" stopOpacity={0.15} />
              <stop offset="95%" stopColor="#6b7280" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="gradCompleted" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10b981" stopOpacity={0.15} />
              <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
            </linearGradient>
          </defs>

          <CartesianGrid
            strokeDasharray="3 3"
            stroke="currentColor"
            strokeOpacity={0.08}
          />

          <XAxis
            dataKey="date"
            tick={{ fill: "currentColor", fontSize: 12, opacity: 0.5 }}
            axisLine={false}
            tickLine={false}
          />

          <YAxis
            tick={{ fill: "currentColor", fontSize: 12, opacity: 0.5 }}
            axisLine={false}
            tickLine={false}
          />

          <Tooltip
            contentStyle={{
              background: "var(--card)",
              border: "1px solid var(--border)",
              borderRadius: "8px",
              fontSize: "13px",
              color: "var(--card-foreground)",
            }}
          />

          <Legend wrapperStyle={{ fontSize: "13px", paddingTop: "16px" }} />

          <Area
            type="monotone"
            dataKey="created"
            name="Tasks Created"
            stroke="#6b7280"
            strokeWidth={2}
            fill="url(#gradCreated)"
            dot={false}
            activeDot={{ r: 4 }}
          />

          <Area
            type="monotone"
            dataKey="completed"
            name="Tasks Completed"
            stroke="#10b981"
            strokeWidth={2}
            fill="url(#gradCompleted)"
            dot={false}
            activeDot={{ r: 4 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
