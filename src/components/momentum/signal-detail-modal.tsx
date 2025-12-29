'use client';

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import {
  TrendingUp,
  AlertTriangle,
  DollarSign,
  Activity,
  LogOut,
  Users,
  Clock,
  Copy,
  ExternalLink,
  CheckCircle,
  XCircle,
  PauseCircle,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface SignalDetailModalProps {
  signalId: string;
  signal?: {
    _id: string;
    type: 'expansion' | 'risk' | 'buying_intent' | 'usage' | 'churn' | 'relationship';
    confidence: number;
    sentiment: 'positive' | 'negative' | 'neutral';
    urgency: boolean;
    text: string;
    customerId?: string;
    channelId?: string;
    status: 'new' | 'handled' | 'dismissed' | 'snoozed' | 'synced';
    createdAt: number;
    updatedAt: number;
    customerName: string;
    channelName: string;
  };
  isOpen: boolean;
  onClose: () => void;
}

const SIGNAL_DETAILS = {
  expansion: {
    title: 'Expansion Opportunity',
    description: 'Customer is signaling growth and may need additional features or capacity',
    actionLabel: 'Create Expansion Opportunity',
    recommendations: [
      'Schedule call with customer to discuss their growth plans',
      'Review their current usage and capacity needs',
      'Prepare proposal for additional features or higher tier',
    ],
  },
  risk: {
    title: 'Risk Alert',
    description: 'Customer has reported issues or expressed frustration',
    actionLabel: 'Create Support Task',
    recommendations: [
      'Contact customer immediately to resolve issue',
      'Escalate to technical support if needed',
      'Follow up after resolution to ensure satisfaction',
    ],
  },
  buying_intent: {
    title: 'Buying Intent',
    description: 'Customer is interested in purchasing or upgrading',
    actionLabel: 'Create Sales Opportunity',
    recommendations: [
      'Send pricing and feature information',
      'Schedule demo if appropriate',
      'Move quickly to close the deal',
    ],
  },
  usage: {
    title: 'Usage Signal',
    description: 'Customer is using product features actively',
    actionLabel: 'Log Activity',
    recommendations: [
      'Update customer success notes',
      'Review which features they are using',
      'Identify opportunities for advanced features',
    ],
  },
  churn: {
    title: 'Churn Risk',
    description: 'Customer may be at risk of leaving',
    actionLabel: 'Create Retention Plan',
    recommendations: [
      'Contact customer to understand concerns',
      'Offer alternatives or solutions',
      'Consider special offer to retain',
    ],
  },
  relationship: {
    title: 'Relationship Change',
    description: 'There have been organizational changes with the customer',
    actionLabel: 'Update Contact Info',
    recommendations: [
      'Update contact database with new information',
      'Reach out to new decision makers',
      'Re-establish relationship if needed',
    ],
  },
};

export function SignalDetailModal({
  signalId,
  signal,
  isOpen,
  onClose,
}: SignalDetailModalProps) {
  const [selectedAction, setSelectedAction] = useState<string | null>(null);

  if (!signal) return null;

  const details = SIGNAL_DETAILS[signal.type];
  const config = SIGNAL_DETAILS[signal.type];

  const handleAction = (action: string) => {
    console.log(`Action: ${action} for signal ${signalId}`);
    setSelectedAction(action);
    // In real app, would call Convex mutation to create opportunity, etc
    // For now, just show feedback
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <DialogTitle className="text-xl">{config.title}</DialogTitle>
              <DialogDescription className="mt-1">
                {config.description}
              </DialogDescription>
            </div>
            <Badge
              variant="outline"
              className={cn(
                'flex-shrink-0',
                signal.status === 'new' && 'border-blue-500 text-blue-600'
              )}
            >
              {signal.status}
            </Badge>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Original Message */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Original Message</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm leading-relaxed border-l-4 border-muted-foreground pl-4">
                "{signal.text}"
              </p>
              <div className="mt-4 flex flex-wrap gap-2 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {formatDistanceToNow(signal.createdAt, { addSuffix: true })}
                </span>
                <span>•</span>
                <span className="font-medium">{signal.customerName}</span>
                <span>•</span>
                <code className="bg-muted px-1.5 py-0.5 rounded">
                  {signal.channelName}
                </code>
              </div>
            </CardContent>
          </Card>

          {/* Signal Analysis */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Signal Analysis</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase">
                    Confidence Score
                  </p>
                  <div className="mt-2 flex items-baseline gap-2">
                    <span className="text-2xl font-bold">{signal.confidence}%</span>
                    <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-500 rounded-full"
                        style={{ width: `${signal.confidence}%` }}
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase">
                    Sentiment
                  </p>
                  <p className="mt-2 text-sm font-semibold capitalize">
                    {signal.sentiment}{' '}
                    {signal.urgency && (
                      <span className="text-red-600">• Urgent</span>
                    )}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recommendations */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Recommended Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {details.recommendations.map((rec, idx) => (
                  <li key={idx} className="flex gap-2 text-sm">
                    <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                    <span>{rec}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">CRM Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button
                className="w-full justify-start"
                variant="outline"
                onClick={() => handleAction('create-opportunity')}
              >
                <TrendingUp className="w-4 h-4 mr-2" />
                {details.actionLabel}
              </Button>

              <Button
                className="w-full justify-start"
                variant="outline"
                onClick={() => handleAction('view-customer')}
              >
                <Users className="w-4 h-4 mr-2" />
                View Customer Profile
              </Button>

              <Button
                className="w-full justify-start"
                variant="outline"
                onClick={() => handleAction('copy-link')}
              >
                <Copy className="w-4 h-4 mr-2" />
                Copy Slack Link
              </Button>

              <Separator className="my-2" />

              <Button
                className="w-full justify-start"
                variant="ghost"
                size="sm"
                onClick={() => handleAction('mark-handled')}
              >
                <CheckCircle className="w-4 h-4 mr-2 text-green-600" />
                Mark as Handled
              </Button>

              <Button
                className="w-full justify-start"
                variant="ghost"
                size="sm"
                onClick={() => handleAction('snooze')}
              >
                <PauseCircle className="w-4 h-4 mr-2 text-yellow-600" />
                Snooze for 1 Week
              </Button>

              <Button
                className="w-full justify-start"
                variant="ghost"
                size="sm"
                onClick={() => handleAction('dismiss')}
              >
                <XCircle className="w-4 h-4 mr-2 text-gray-600" />
                Dismiss Signal
              </Button>
            </CardContent>
          </Card>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          <Button onClick={() => handleAction('create-opportunity')}>
            {details.actionLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
