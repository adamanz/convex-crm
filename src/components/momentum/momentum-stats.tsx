'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import {
  BarChart3,
  AlertCircle,
  TrendingUp,
  Zap,
  ArrowUp,
  ArrowDown,
} from 'lucide-react';

interface MomentumStatsProps {
  totalSignals: number;
  newSignals: number;
  highConfidenceSignals: number;
  urgentSignals: number;
  isLoading?: boolean;
}

interface StatCardProps {
  label: string;
  value: number;
  icon: React.ReactNode;
  color: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
}

function StatCard({ label, value, icon, color, trend }: StatCardProps) {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4 flex items-start gap-4">
        <div className={cn('rounded-lg p-2.5 h-fit', color)}>
          {icon}
        </div>
        <div className="flex-1">
          <p className="text-xs text-gray-600 font-medium">{label}</p>
          <div className="flex items-baseline gap-2 mt-1">
            <p className="text-2xl font-bold text-gray-900">{value}</p>
            {trend && (
              <div
                className={cn(
                  'flex items-center gap-0.5 text-xs font-semibold',
                  trend.isPositive ? 'text-red-600' : 'text-green-600'
                )}
              >
                {trend.isPositive ? (
                  <ArrowUp className="w-3 h-3" />
                ) : (
                  <ArrowDown className="w-3 h-3" />
                )}
                {trend.value}%
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function MomentumStats({
  totalSignals,
  newSignals,
  highConfidenceSignals,
  urgentSignals,
  isLoading = false,
}: MomentumStatsProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardContent className="p-4 h-24 animate-pulse bg-gray-100 rounded" />
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard
        label="Total Signals"
        value={totalSignals}
        icon={<BarChart3 className="w-5 h-5 text-blue-600" />}
        color="bg-blue-100"
        trend={{ value: totalSignals > 10 ? 15 : 5, isPositive: true }}
      />
      <StatCard
        label="New Signals"
        value={newSignals}
        icon={<AlertCircle className="w-5 h-5 text-yellow-600" />}
        color="bg-yellow-100"
      />
      <StatCard
        label="High Confidence (80%+)"
        value={highConfidenceSignals}
        icon={<TrendingUp className="w-5 h-5 text-green-600" />}
        color="bg-green-100"
      />
      <StatCard
        label="Urgent Signals"
        value={urgentSignals}
        icon={<Zap className="w-5 h-5 text-red-600" />}
        color="bg-red-100"
      />
    </div>
  );
}
