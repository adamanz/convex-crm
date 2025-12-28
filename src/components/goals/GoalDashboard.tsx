"use client";

import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { cn, formatCurrency, formatNumber } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Target,
  TrendingUp,
  CheckCircle2,
  AlertCircle,
  Clock,
  DollarSign,
  Handshake,
  Activity,
  Phone,
} from "lucide-react";
import { format } from "date-fns";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

interface GoalDashboardProps {
  userId?: Id<"users">;
  className?: string;
}

const COLORS = {
  revenue: "#22c55e",
  deals: "#6366f1",
  activities: "#f59e0b",
  calls: "#8b5cf6",
  completed: "#22c55e",
  onTrack: "#3b82f6",
  behind: "#ef4444",
};

const typeIcons = {
  revenue: DollarSign,
  deals: Handshake,
  activities: Activity,
  calls: Phone,
};

function StatCard({
  icon: Icon,
  label,
  value,
  subValue,
  color,
  className,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string | number;
  subValue?: string;
  color: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900",
        className
      )}
    >
      <div className="flex items-center gap-3">
        <div
          className="flex h-10 w-10 items-center justify-center rounded-lg"
          style={{ backgroundColor: `${color}15` }}
        >
          <span style={{ color }}>
            <Icon className="h-5 w-5" />
          </span>
        </div>
        <div>
          <p className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
            {value}
          </p>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">{label}</p>
          {subValue && (
            <p className="text-xs text-zinc-400 dark:text-zinc-500">
              {subValue}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export function GoalDashboard({ userId, className }: GoalDashboardProps) {
  const stats = useQuery(api.goals.rollupStats, {
    ownerId: userId,
    includeTeam: true,
  });

  if (stats === undefined) {
    return (
      <div className={cn("space-y-6", className)}>
        <div className="grid gap-4 md:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          <Skeleton className="h-72 rounded-xl" />
          <Skeleton className="h-72 rounded-xl" />
        </div>
      </div>
    );
  }

  // Prepare chart data
  const statusData = [
    { name: "Completed", value: stats.completedGoals, color: COLORS.completed },
    { name: "On Track", value: stats.onTrackGoals, color: COLORS.onTrack },
    { name: "Behind", value: stats.behindGoals, color: COLORS.behind },
  ].filter((d) => d.value > 0);

  const typeData = stats.typeStats.map((t) => ({
    name: t.type.charAt(0).toUpperCase() + t.type.slice(1),
    progress: Math.round(t.avgProgress),
    target: 100,
    color: COLORS[t.type as keyof typeof COLORS] || "#6b7280",
  }));

  return (
    <div className={cn("space-y-6", className)}>
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={Target}
          label="Total Goals"
          value={stats.totalGoals}
          color="#6366f1"
        />
        <StatCard
          icon={CheckCircle2}
          label="Completed"
          value={stats.completedGoals}
          subValue={`${stats.completionRate.toFixed(0)}% completion rate`}
          color="#22c55e"
        />
        <StatCard
          icon={TrendingUp}
          label="On Track"
          value={stats.onTrackGoals}
          color="#3b82f6"
        />
        <StatCard
          icon={AlertCircle}
          label="Behind Schedule"
          value={stats.behindGoals}
          color="#ef4444"
        />
      </div>

      {/* Charts Row */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Status Distribution Pie Chart */}
        <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
          <h3 className="mb-4 text-sm font-semibold text-zinc-900 dark:text-zinc-50">
            Goal Status Distribution
          </h3>
          {statusData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={4}
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}`}
                  labelLine={false}
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#18181b",
                    border: "1px solid #27272a",
                    borderRadius: "8px",
                    color: "#fafafa",
                  }}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-52 items-center justify-center text-zinc-500 dark:text-zinc-400">
              No goals to display
            </div>
          )}
        </div>

        {/* Progress by Type Bar Chart */}
        <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
          <h3 className="mb-4 text-sm font-semibold text-zinc-900 dark:text-zinc-50">
            Average Progress by Goal Type
          </h3>
          {typeData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={typeData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                <XAxis
                  type="number"
                  domain={[0, 100]}
                  tickFormatter={(value) => `${value}%`}
                  stroke="#71717a"
                  fontSize={12}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  stroke="#71717a"
                  fontSize={12}
                  width={80}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#18181b",
                    border: "1px solid #27272a",
                    borderRadius: "8px",
                    color: "#fafafa",
                  }}
                  formatter={(value) => [`${value ?? 0}%`, "Progress"]}
                />
                <Bar dataKey="progress" radius={[0, 4, 4, 0]}>
                  {typeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-52 items-center justify-center text-zinc-500 dark:text-zinc-400">
              No goals to display
            </div>
          )}
        </div>
      </div>

      {/* Type Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.typeStats.map((typeStat) => {
          const Icon = typeIcons[typeStat.type as keyof typeof typeIcons];
          const color = COLORS[typeStat.type as keyof typeof COLORS] || "#6b7280";
          const formatFn = typeStat.type === "revenue" ? formatCurrency : formatNumber;

          return (
            <div
              key={typeStat.type}
              className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900"
            >
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div
                    className="flex h-8 w-8 items-center justify-center rounded-lg"
                    style={{ backgroundColor: `${color}15` }}
                  >
                    <Icon className="h-4 w-4" style={{ color }} />
                  </div>
                  <span className="text-sm font-medium text-zinc-900 dark:text-zinc-50 capitalize">
                    {typeStat.type}
                  </span>
                </div>
                <span className="text-xs text-zinc-500 dark:text-zinc-400">
                  {typeStat.count} goals
                </span>
              </div>
              <div className="mb-2">
                <div className="relative h-2 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
                  <div
                    className="absolute inset-y-0 left-0 rounded-full"
                    style={{
                      width: `${Math.min(100, typeStat.avgProgress)}%`,
                      backgroundColor: color,
                    }}
                  />
                </div>
              </div>
              <div className="flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400">
                <span>{formatFn(typeStat.totalCurrent)}</span>
                <span>of {formatFn(typeStat.totalTarget)}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Upcoming Deadlines */}
      {stats.upcomingDeadlines.length > 0 && (
        <div className="rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
          <div className="border-b border-zinc-200 px-4 py-3 dark:border-zinc-800">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-amber-500" />
              <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                Upcoming Deadlines
              </h3>
            </div>
          </div>
          <div className="divide-y divide-zinc-200 dark:divide-zinc-800">
            {stats.upcomingDeadlines.map((goal) => {
              const Icon = typeIcons[goal.type as keyof typeof typeIcons];
              const color = COLORS[goal.type as keyof typeof COLORS] || "#6b7280";
              const daysLeft = Math.ceil(
                (goal.endDate - Date.now()) / (1000 * 60 * 60 * 24)
              );

              return (
                <div
                  key={goal._id}
                  className="flex items-center justify-between px-4 py-3"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="flex h-8 w-8 items-center justify-center rounded-lg"
                      style={{ backgroundColor: `${color}15` }}
                    >
                      <Icon className="h-4 w-4" style={{ color }} />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
                        {goal.name}
                      </p>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400">
                        {goal.progressPercent.toFixed(0)}% complete
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p
                      className={cn(
                        "text-sm font-medium",
                        daysLeft <= 2
                          ? "text-red-600 dark:text-red-400"
                          : daysLeft <= 5
                            ? "text-amber-600 dark:text-amber-400"
                            : "text-zinc-900 dark:text-zinc-50"
                      )}
                    >
                      {daysLeft} day{daysLeft !== 1 ? "s" : ""} left
                    </p>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">
                      {format(new Date(goal.endDate), "MMM d, yyyy")}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
