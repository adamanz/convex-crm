'use client';

import React, { useState } from 'react';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { SignalCard } from '@/components/momentum/signal-card';
import { SignalFilters } from '@/components/momentum/signal-filters';
import { SignalDetailModal } from '@/components/momentum/signal-detail-modal';
import { MomentumStats } from '@/components/momentum/momentum-stats';
import { AlertCircle, TrendingUp, Zap } from 'lucide-react';

type SignalStatus = 'new' | 'handled' | 'dismissed' | 'snoozed' | 'synced';
type SignalType = 'expansion' | 'risk' | 'buying_intent' | 'usage' | 'churn' | 'relationship';

interface FilterState {
  signalType: SignalType | 'all';
  status: SignalStatus | 'all';
  confidence: number;
  searchText: string;
  sortBy: 'recent' | 'confidence' | 'urgency';
}

export default function MomentumDashboard() {
  const [filters, setFilters] = useState<FilterState>({
    signalType: 'all',
    status: 'new',
    confidence: 50,
    searchText: '',
    sortBy: 'recent',
  });

  const [selectedSignalId, setSelectedSignalId] = useState<string | null>(null);

  // Fetch all signals (in real app, would paginate)
  // TODO: Replace with actual Convex query once workspace selection is added
  // const signals = useQuery(api.momentum.messages.getSignals, { workspaceId: workspaceId });

  // Mock data for now
  const mockSignals = [
    {
      _id: 'signal-1',
      type: 'expansion',
      confidence: 87,
      sentiment: 'neutral' as const,
      urgency: false,
      text: 'We are running out of capacity and need to scale',
      customerId: 'customer-1',
      channelId: 'channel-1',
      status: 'new' as const,
      createdAt: Date.now() - 3600000, // 1 hour ago
      updatedAt: Date.now() - 3600000,
      customerName: 'Acme Corp',
      channelName: '#acme-customer',
    },
    {
      _id: 'signal-2',
      type: 'risk',
      confidence: 92,
      sentiment: 'negative' as const,
      urgency: true,
      text: 'This feature is completely broken and costing us time',
      customerId: 'customer-2',
      channelId: 'channel-2',
      status: 'new' as const,
      createdAt: Date.now() - 7200000, // 2 hours ago
      updatedAt: Date.now() - 7200000,
      customerName: 'TechFlow Inc',
      channelName: '#support-escalations',
    },
    {
      _id: 'signal-3',
      type: 'buying_intent',
      confidence: 78,
      sentiment: 'positive' as const,
      urgency: false,
      text: 'How much would it cost to add 50 more users?',
      customerId: 'customer-3',
      channelId: 'channel-3',
      status: 'new' as const,
      createdAt: Date.now() - 10800000, // 3 hours ago
      updatedAt: Date.now() - 10800000,
      customerName: 'GrowthCo',
      channelName: '#customer-growthco',
    },
    {
      _id: 'signal-4',
      type: 'usage',
      confidence: 72,
      sentiment: 'positive' as const,
      urgency: false,
      text: 'We have successfully rolled out to all 200 team members',
      customerId: 'customer-4',
      channelId: 'channel-4',
      status: 'handled' as const,
      createdAt: Date.now() - 86400000, // 1 day ago
      updatedAt: Date.now() - 86400000,
      customerName: 'Scale Systems',
      channelName: '#customer-scale',
    },
  ];

  // Filter signals
  const filteredSignals = mockSignals.filter((signal) => {
    if (filters.signalType !== 'all' && signal.type !== filters.signalType) return false;
    if (filters.status !== 'all' && signal.status !== filters.status) return false;
    if (signal.confidence < filters.confidence) return false;
    if (
      filters.searchText &&
      !signal.text.toLowerCase().includes(filters.searchText.toLowerCase()) &&
      !signal.customerName.toLowerCase().includes(filters.searchText.toLowerCase())
    ) {
      return false;
    }
    return true;
  });

  // Sort signals
  const sortedSignals = [...filteredSignals].sort((a, b) => {
    switch (filters.sortBy) {
      case 'confidence':
        return b.confidence - a.confidence;
      case 'urgency':
        return b.urgency ? -1 : a.urgency ? 1 : 0;
      case 'recent':
      default:
        return b.createdAt - a.createdAt;
    }
  });

  const stats = {
    total: mockSignals.length,
    new: mockSignals.filter((s) => s.status === 'new').length,
    highConfidence: mockSignals.filter((s) => s.confidence > 80).length,
    urgent: mockSignals.filter((s) => s.urgency).length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Momentum</h1>
          <p className="text-sm text-muted-foreground mt-1">
            AI-powered sales signals from Slack
          </p>
        </div>
        <Button variant="default" size="lg">
          <Zap className="w-4 h-4 mr-2" />
          Setup Workspace
        </Button>
      </div>

      {/* Stats */}
      <MomentumStats stats={stats} />

      {/* Alerts */}
      {stats.urgent > 0 && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium text-red-900">
                {stats.urgent} urgent signal{stats.urgent !== 1 ? 's' : ''} requiring attention
              </p>
              <p className="text-sm text-red-700 mt-1">
                Customers have reported issues that need immediate action
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters & Controls */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-4">
            {/* Search */}
            <Input
              placeholder="Search signals or customers..."
              value={filters.searchText}
              onChange={(e) =>
                setFilters({ ...filters, searchText: e.target.value })
              }
              className="max-w-md"
            />

            {/* Filter Controls */}
            <div className="flex flex-wrap gap-3">
              <SignalFilters filters={filters} setFilters={setFilters} />

              {/* Sort */}
              <Select
                value={filters.sortBy}
                onValueChange={(value: any) =>
                  setFilters({ ...filters, sortBy: value })
                }
              >
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="recent">Recent</SelectItem>
                  <SelectItem value="confidence">Confidence</SelectItem>
                  <SelectItem value="urgency">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Results count */}
          <div className="text-sm text-muted-foreground">
            Showing {sortedSignals.length} of {mockSignals.length} signals
          </div>
        </CardContent>
      </Card>

      {/* Signals Feed */}
      <div className="space-y-3">
        {sortedSignals.length > 0 ? (
          <>
            {sortedSignals.map((signal) => (
              <SignalCard
                key={signal._id}
                signal={signal}
                onClick={() => setSelectedSignalId(signal._id)}
              />
            ))}
          </>
        ) : (
          <Card>
            <CardContent className="pt-12 text-center">
              <TrendingUp className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-semibold">No signals found</h3>
              <p className="text-sm text-muted-foreground mt-1">
                {mockSignals.length === 0
                  ? 'Connect a Slack workspace to start detecting signals'
                  : 'Try adjusting your filters'}
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Signal Detail Modal */}
      {selectedSignalId && (
        <SignalDetailModal
          signalId={selectedSignalId}
          signal={sortedSignals.find((s) => s._id === selectedSignalId)}
          isOpen={!!selectedSignalId}
          onClose={() => setSelectedSignalId(null)}
        />
      )}
    </div>
  );
}
