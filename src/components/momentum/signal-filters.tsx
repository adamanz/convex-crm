'use client';

import React from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { X } from 'lucide-react';

type SignalType = 'expansion' | 'risk' | 'buying_intent' | 'usage' | 'churn' | 'relationship';
type SignalStatus = 'new' | 'handled' | 'dismissed' | 'snoozed' | 'synced';

interface SignalFiltersProps {
  signalType: 'all' | SignalType;
  status: 'all' | SignalStatus;
  confidence: number;
  searchText: string;
  onTypeChange: (type: 'all' | SignalType) => void;
  onStatusChange: (status: 'all' | SignalStatus) => void;
  onConfidenceChange: (confidence: number) => void;
  onSearchChange: (text: string) => void;
  onClearFilters: () => void;
  hasActiveFilters: boolean;
}

const SIGNAL_TYPES = [
  { value: 'expansion', label: '📈 Expansion' },
  { value: 'risk', label: '⚠️ Risk' },
  { value: 'buying_intent', label: '🛒 Buying Intent' },
  { value: 'usage', label: '📊 Usage' },
  { value: 'churn', label: '👋 Churn Risk' },
  { value: 'relationship', label: '👥 Relationship' },
];

const STATUSES = [
  { value: 'new', label: '🆕 New' },
  { value: 'handled', label: '✅ Handled' },
  { value: 'dismissed', label: '❌ Dismissed' },
  { value: 'snoozed', label: '⏸️ Snoozed' },
  { value: 'synced', label: '🔄 Synced' },
];

export function SignalFilters({
  signalType,
  status,
  confidence,
  searchText,
  onTypeChange,
  onStatusChange,
  onConfidenceChange,
  onSearchChange,
  onClearFilters,
  hasActiveFilters,
}: SignalFiltersProps) {
  return (
    <Card className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-900">Filters</h3>
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearFilters}
            className="text-xs"
          >
            <X className="w-3 h-3 mr-1" />
            Clear all
          </Button>
        )}
      </div>

      {/* Search */}
      <div>
        <label className="text-xs font-medium text-gray-700 block mb-2">
          Search
        </label>
        <Input
          placeholder="Search signals..."
          value={searchText}
          onChange={(e) => onSearchChange(e.target.value)}
          className="text-sm"
        />
      </div>

      {/* Signal Type Filter */}
      <div>
        <label className="text-xs font-medium text-gray-700 block mb-2">
          Signal Type
        </label>
        <Select
          value={signalType}
          onValueChange={(value) => onTypeChange(value as 'all' | SignalType)}
        >
          <SelectTrigger className="text-sm">
            <SelectValue placeholder="Select type..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {SIGNAL_TYPES.map((type) => (
              <SelectItem key={type.value} value={type.value}>
                {type.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Status Filter */}
      <div>
        <label className="text-xs font-medium text-gray-700 block mb-2">
          Status
        </label>
        <Select
          value={status}
          onValueChange={(value) => onStatusChange(value as 'all' | SignalStatus)}
        >
          <SelectTrigger className="text-sm">
            <SelectValue placeholder="Select status..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {STATUSES.map((st) => (
              <SelectItem key={st.value} value={st.value}>
                {st.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Confidence Slider */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs font-medium text-gray-700">
            Confidence Score
          </label>
          <span className="text-xs font-semibold text-gray-900">
            {confidence}%+
          </span>
        </div>
        <Slider
          value={[confidence]}
          onValueChange={(value) => onConfidenceChange(value[0])}
          min={0}
          max={100}
          step={5}
          className="w-full"
        />
        <p className="text-xs text-gray-500 mt-1">
          Show signals with confidence above {confidence}%
        </p>
      </div>
    </Card>
  );
}
