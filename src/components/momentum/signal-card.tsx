'use client';

import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import {
  TrendingUp,
  AlertTriangle,
  ShoppingCart,
  Activity,
  LogOut,
  Users,
  Clock,
  AlertCircle,
  Zap,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

type SignalType = 'expansion' | 'risk' | 'buying_intent' | 'usage' | 'churn' | 'relationship';
type SignalStatus = 'new' | 'handled' | 'dismissed' | 'snoozed' | 'synced';

interface SignalCardProps {
  _id: string;
  type: SignalType;
  confidence: number;
  sentiment?: 'positive' | 'negative' | 'neutral' | 'urgent';
  text: string;
  status: SignalStatus;
  createdAt: number;
  customerName: string;
  channelName: string;
  urgency?: boolean;
  onClick?: () => void;
}

const SIGNAL_CONFIG = {
  expansion: {
    label: 'Expansion',
    icon: TrendingUp,
    color: 'bg-blue-100',
    borderColor: 'border-blue-200',
    textColor: 'text-blue-700',
    badgeVariant: 'outline' as const,
  },
  risk: {
    label: 'Risk',
    icon: AlertTriangle,
    color: 'bg-red-100',
    borderColor: 'border-red-200',
    textColor: 'text-red-700',
    badgeVariant: 'destructive' as const,
  },
  buying_intent: {
    label: 'Buying Intent',
    icon: ShoppingCart,
    color: 'bg-green-100',
    borderColor: 'border-green-200',
    textColor: 'text-green-700',
    badgeVariant: 'outline' as const,
  },
  usage: {
    label: 'Usage',
    icon: Activity,
    color: 'bg-purple-100',
    borderColor: 'border-purple-200',
    textColor: 'text-purple-700',
    badgeVariant: 'outline' as const,
  },
  churn: {
    label: 'Churn Risk',
    icon: LogOut,
    color: 'bg-orange-100',
    borderColor: 'border-orange-200',
    textColor: 'text-orange-700',
    badgeVariant: 'outline' as const,
  },
  relationship: {
    label: 'Relationship',
    icon: Users,
    color: 'bg-indigo-100',
    borderColor: 'border-indigo-200',
    textColor: 'text-indigo-700',
    badgeVariant: 'outline' as const,
  },
};

const getConfidenceColor = (confidence: number) => {
  if (confidence >= 85) return 'text-green-600';
  if (confidence >= 70) return 'text-blue-600';
  if (confidence >= 50) return 'text-yellow-600';
  return 'text-gray-400';
};

const getSentimentIcon = (sentiment?: string) => {
  if (sentiment === 'positive') return '😊';
  if (sentiment === 'negative') return '😞';
  if (sentiment === 'urgent') return '🚨';
  return '😐';
};

export function SignalCard({
  _id,
  type,
  confidence,
  sentiment,
  text,
  status,
  createdAt,
  customerName,
  channelName,
  urgency,
  onClick,
}: SignalCardProps) {
  const config = SIGNAL_CONFIG[type];
  const Icon = config.icon;

  return (
    <Card
      onClick={onClick}
      className={cn(
        'p-4 cursor-pointer hover:shadow-md transition-shadow',
        status === 'new' && 'border-2 border-blue-500',
        'flex gap-4'
      )}
    >
      {/* Left side: Icon and info */}
      <div className="flex-1 flex gap-3">
        <div className={cn('rounded-lg p-2 flex-shrink-0 h-fit', config.color)}>
          <Icon className={cn('w-5 h-5', config.textColor)} />
        </div>

        <div className="flex-1 min-w-0">
          {/* Header with type and status */}
          <div className="flex items-start gap-2 mb-2">
            <span className="text-sm font-semibold text-gray-900">
              {config.label}
            </span>
            {status === 'new' && (
              <Badge variant="default" className="text-xs">
                NEW
              </Badge>
            )}
            {urgency && (
              <Badge variant="destructive" className="text-xs">
                <Zap className="w-3 h-3 mr-1" />
                Urgent
              </Badge>
            )}
          </div>

          {/* Customer and channel */}
          <p className="text-xs text-gray-600 mb-2">
            <span className="font-medium hover:underline">{customerName}</span>
            <span className="mx-1">•</span>
            <code className="bg-gray-100 px-2 py-0.5 rounded text-xs">
              {channelName}
            </code>
          </p>

          {/* Signal text */}
          <p className="text-sm text-gray-700 line-clamp-2 mb-2">{text}</p>

          {/* Footer: time and sentiment */}
          <div className="flex items-center gap-3 text-xs text-gray-500">
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {formatDistanceToNow(createdAt, { addSuffix: true })}
            </span>
            {sentiment && (
              <span className="flex items-center gap-1">
                {getSentimentIcon(sentiment)} {sentiment}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Right side: Confidence score */}
      <div className="flex flex-col items-end justify-start gap-2 flex-shrink-0">
        <div className="text-right">
          <p className={cn('text-2xl font-bold', getConfidenceColor(confidence))}>
            {confidence}%
          </p>
          <p className="text-xs text-gray-500 whitespace-nowrap">confidence</p>
        </div>

        {/* Confidence bar */}
        <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            className={cn(
              'h-full rounded-full transition-all',
              confidence >= 85
                ? 'bg-green-500'
                : confidence >= 70
                  ? 'bg-blue-500'
                  : confidence >= 50
                    ? 'bg-yellow-500'
                    : 'bg-gray-400'
            )}
            style={{ width: `${confidence}%` }}
          />
        </div>
      </div>
    </Card>
  );
}
