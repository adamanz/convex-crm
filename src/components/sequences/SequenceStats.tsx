"use client";

import * as React from "react";
import {
  BarChart3,
  TrendingUp,
  Users,
  CheckCircle,
  MessageSquare,
  Mail,
  Phone,
  Clock,
  CheckSquare,
  Eye,
  MousePointerClick,
  Reply,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { SEQUENCE_STEP_CONFIGS } from "./SequenceStep";

interface StepStat {
  stepId: string;
  stepIndex: number;
  stepType: "email" | "sms" | "call" | "wait" | "task";
  totalExecutions: number;
  sentCount: number;
  openedCount: number;
  clickedCount: number;
  repliedCount: number;
  failedCount: number;
  openRate: number;
  clickRate: number;
  replyRate: number;
}

interface SequenceStatsData {
  sequenceId: string;
  totalEnrollments: number;
  activeEnrollments: number;
  completedEnrollments: number;
  repliedEnrollments: number;
  overallOpenRate: number;
  overallReplyRate: number;
  stepStats: StepStat[];
}

interface SequenceStatsProps {
  stats: SequenceStatsData | null | undefined;
  isLoading?: boolean;
  className?: string;
}

export function SequenceStats({ stats, isLoading, className }: SequenceStatsProps) {
  if (isLoading) {
    return (
      <div className={cn("flex items-center justify-center h-48", className)}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!stats) {
    return (
      <div className={cn("text-center py-8 text-muted-foreground", className)}>
        No statistics available yet
      </div>
    );
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* Overview Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Enrolled"
          value={stats.totalEnrollments}
          icon={Users}
          description="All time"
        />
        <StatCard
          title="Active"
          value={stats.activeEnrollments}
          icon={TrendingUp}
          description="Currently in sequence"
          variant="blue"
        />
        <StatCard
          title="Completed"
          value={stats.completedEnrollments}
          icon={CheckCircle}
          description="Finished all steps"
          variant="green"
        />
        <StatCard
          title="Replied"
          value={stats.repliedEnrollments}
          icon={Reply}
          description="Got a response"
          variant="purple"
        />
      </div>

      {/* Overall Rates */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Overall Performance</CardTitle>
          <CardDescription>Aggregate rates across all steps</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <Eye className="h-4 w-4 text-muted-foreground" />
                  <span>Open Rate</span>
                </div>
                <span className="font-medium">{stats.overallOpenRate.toFixed(1)}%</span>
              </div>
              <Progress value={stats.overallOpenRate} className="h-2" />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <Reply className="h-4 w-4 text-muted-foreground" />
                  <span>Reply Rate</span>
                </div>
                <span className="font-medium">{stats.overallReplyRate.toFixed(1)}%</span>
              </div>
              <Progress value={stats.overallReplyRate} className="h-2" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Per-Step Stats */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Step Performance</CardTitle>
          <CardDescription>Performance metrics for each step</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {stats.stepStats.map((stepStat, index) => (
              <StepStatRow key={stepStat.stepId} stepStat={stepStat} stepNumber={index + 1} />
            ))}
            {stats.stepStats.length === 0 && (
              <div className="text-center py-4 text-muted-foreground">
                No step data available yet
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

interface StatCardProps {
  title: string;
  value: number;
  icon: React.ComponentType<{ className?: string }>;
  description?: string;
  variant?: "default" | "blue" | "green" | "purple";
}

function StatCard({ title, value, icon: Icon, description, variant = "default" }: StatCardProps) {
  const colorClasses = {
    default: "bg-muted text-muted-foreground",
    blue: "bg-blue-100 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400",
    green: "bg-green-100 text-green-600 dark:bg-green-900/20 dark:text-green-400",
    purple: "bg-purple-100 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400",
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center gap-3">
          <div className={cn("p-2 rounded-lg", colorClasses[variant])}>
            <Icon className="h-5 w-5" />
          </div>
          <div>
            <div className="text-2xl font-bold">{value}</div>
            <div className="text-sm text-muted-foreground">{title}</div>
          </div>
        </div>
        {description && (
          <p className="text-xs text-muted-foreground mt-2">{description}</p>
        )}
      </CardContent>
    </Card>
  );
}

interface StepStatRowProps {
  stepStat: StepStat;
  stepNumber: number;
}

function StepStatRow({ stepStat, stepNumber }: StepStatRowProps) {
  const config = SEQUENCE_STEP_CONFIGS[stepStat.stepType];
  const Icon = config.icon;

  return (
    <div className="flex items-center gap-4 p-3 rounded-lg border bg-card">
      {/* Step Info */}
      <div className="flex items-center gap-3 min-w-[140px]">
        <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium">
          {stepNumber}
        </div>
        <div className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-white", config.color)}>
          <Icon className="h-4 w-4" />
        </div>
        <span className="text-sm font-medium">{config.label}</span>
      </div>

      {/* Stats */}
      <div className="flex-1 grid grid-cols-4 gap-4">
        <div className="text-center">
          <div className="text-lg font-semibold">{stepStat.sentCount}</div>
          <div className="text-xs text-muted-foreground">Sent</div>
        </div>

        {(stepStat.stepType === "email" || stepStat.stepType === "sms") && (
          <>
            <div className="text-center">
              <div className="text-lg font-semibold">{stepStat.openRate.toFixed(0)}%</div>
              <div className="text-xs text-muted-foreground">Opened</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold">{stepStat.clickRate.toFixed(0)}%</div>
              <div className="text-xs text-muted-foreground">Clicked</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold">{stepStat.replyRate.toFixed(0)}%</div>
              <div className="text-xs text-muted-foreground">Replied</div>
            </div>
          </>
        )}

        {stepStat.stepType === "call" && (
          <>
            <div className="text-center">
              <div className="text-lg font-semibold">{stepStat.totalExecutions}</div>
              <div className="text-xs text-muted-foreground">Scheduled</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold">{stepStat.failedCount}</div>
              <div className="text-xs text-muted-foreground">Failed</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold">{stepStat.replyRate.toFixed(0)}%</div>
              <div className="text-xs text-muted-foreground">Connected</div>
            </div>
          </>
        )}

        {stepStat.stepType === "task" && (
          <>
            <div className="text-center">
              <div className="text-lg font-semibold">{stepStat.totalExecutions}</div>
              <div className="text-xs text-muted-foreground">Created</div>
            </div>
            <div className="text-center" />
            <div className="text-center" />
          </>
        )}

        {stepStat.stepType === "wait" && (
          <>
            <div className="text-center">
              <div className="text-lg font-semibold">{stepStat.totalExecutions}</div>
              <div className="text-xs text-muted-foreground">Completed</div>
            </div>
            <div className="text-center" />
            <div className="text-center" />
          </>
        )}
      </div>
    </div>
  );
}

// Compact stats for sequence card
interface SequenceStatsCompactProps {
  stats: SequenceStatsData | null | undefined;
  className?: string;
}

export function SequenceStatsCompact({ stats, className }: SequenceStatsCompactProps) {
  if (!stats) return null;

  return (
    <div className={cn("flex items-center gap-4 text-sm", className)}>
      <div className="flex items-center gap-1.5">
        <Users className="h-4 w-4 text-muted-foreground" />
        <span>{stats.totalEnrollments}</span>
      </div>
      <div className="flex items-center gap-1.5">
        <Eye className="h-4 w-4 text-muted-foreground" />
        <span>{stats.overallOpenRate.toFixed(0)}%</span>
      </div>
      <div className="flex items-center gap-1.5">
        <Reply className="h-4 w-4 text-muted-foreground" />
        <span>{stats.overallReplyRate.toFixed(0)}%</span>
      </div>
    </div>
  );
}
