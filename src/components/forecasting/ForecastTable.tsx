"use client";

import * as React from "react";
import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn, formatCurrency, formatDate } from "@/lib/utils";
import {
  CheckCircle,
  TrendingUp,
  Clock,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Building,
  User,
} from "lucide-react";

export interface ForecastDeal {
  id: string;
  name: string;
  amount: number;
  probability: number;
  expectedCloseDate?: number;
  companyName?: string;
  ownerName?: string;
  aiAdjustedProbability?: number;
  riskFactors?: string[];
}

export interface ForecastTableProps {
  deals: {
    committed: ForecastDeal[];
    bestCase: ForecastDeal[];
    pipeline: ForecastDeal[];
    omitted: ForecastDeal[];
  };
  closedDeals?: ForecastDeal[];
  totals: {
    committed: number;
    bestCase: number;
    pipeline: number;
    omitted: number;
    closed: number;
  };
  className?: string;
  currency?: string;
  onDealClick?: (dealId: string) => void;
}

const CATEGORY_CONFIG = {
  closed: {
    label: "Closed Won",
    icon: CheckCircle,
    color: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
    description: "Deals already closed in this period",
  },
  committed: {
    label: "Committed",
    icon: TrendingUp,
    color: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
    description: "High probability deals (90%+)",
  },
  bestCase: {
    label: "Best Case",
    icon: Clock,
    color: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
    description: "Medium-high probability deals (70-89%)",
  },
  pipeline: {
    label: "Pipeline",
    icon: AlertTriangle,
    color: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
    description: "Active deals in pipeline (20-69%)",
  },
  omitted: {
    label: "Omitted",
    icon: ChevronDown,
    color: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400",
    description: "Low probability deals (<20%)",
  },
};

interface DealRowProps {
  deal: ForecastDeal;
  currency: string;
  onDealClick?: (dealId: string) => void;
  showAiInsights?: boolean;
}

function DealRow({ deal, currency, onDealClick, showAiInsights = true }: DealRowProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const hasRiskFactors = deal.riskFactors && deal.riskFactors.length > 0;
  const hasAiAdjustment = deal.aiAdjustedProbability !== undefined &&
    deal.aiAdjustedProbability !== deal.probability;

  return (
    <>
      <TableRow
        className={cn(
          "cursor-pointer hover:bg-muted/50",
          hasRiskFactors && "border-l-2 border-l-amber-400"
        )}
        onClick={() => onDealClick?.(deal.id)}
      >
        <TableCell>
          <div className="flex items-center gap-2">
            {hasRiskFactors && showAiInsights && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsExpanded(!isExpanded);
                }}
                className="p-1 hover:bg-muted rounded"
              >
                {isExpanded ? (
                  <ChevronUp className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                )}
              </button>
            )}
            <div>
              <p className="font-medium">{deal.name}</p>
              {deal.companyName && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Building className="h-3 w-3" />
                  {deal.companyName}
                </div>
              )}
            </div>
          </div>
        </TableCell>
        <TableCell className="text-right font-medium">
          {formatCurrency(deal.amount, currency)}
        </TableCell>
        <TableCell className="text-center">
          <div className="flex items-center justify-center gap-2">
            <span>{deal.probability}%</span>
            {hasAiAdjustment && showAiInsights && (
              <Badge
                variant="outline"
                className={cn(
                  "text-xs",
                  deal.aiAdjustedProbability! < deal.probability
                    ? "border-red-300 text-red-600"
                    : "border-green-300 text-green-600"
                )}
              >
                AI: {deal.aiAdjustedProbability}%
              </Badge>
            )}
          </div>
        </TableCell>
        <TableCell>
          {deal.expectedCloseDate ? (
            <span className="text-sm">{formatDate(deal.expectedCloseDate)}</span>
          ) : (
            <span className="text-sm text-muted-foreground">-</span>
          )}
        </TableCell>
        <TableCell>
          {deal.ownerName && (
            <div className="flex items-center gap-1 text-sm">
              <User className="h-3 w-3 text-muted-foreground" />
              {deal.ownerName}
            </div>
          )}
        </TableCell>
      </TableRow>

      {/* Expanded row for risk factors */}
      {isExpanded && hasRiskFactors && (
        <TableRow className="bg-amber-50/50 dark:bg-amber-900/10">
          <TableCell colSpan={5}>
            <div className="py-2 px-4">
              <p className="text-sm font-medium text-amber-700 dark:text-amber-400 mb-1">
                Risk Factors:
              </p>
              <ul className="list-disc list-inside space-y-1">
                {deal.riskFactors!.map((factor, index) => (
                  <li key={index} className="text-sm text-muted-foreground">
                    {factor}
                  </li>
                ))}
              </ul>
            </div>
          </TableCell>
        </TableRow>
      )}
    </>
  );
}

interface CategoryTableProps {
  category: keyof typeof CATEGORY_CONFIG;
  deals: ForecastDeal[];
  total: number;
  currency: string;
  onDealClick?: (dealId: string) => void;
}

function CategoryTable({ category, deals, total, currency, onDealClick }: CategoryTableProps) {
  const config = CATEGORY_CONFIG[category];
  const Icon = config.icon;

  if (deals.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No deals in this category
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Icon className="h-5 w-5" />
          <span className="font-medium">{deals.length} deals</span>
        </div>
        <Badge variant="secondary" className="font-semibold">
          {formatCurrency(total, currency)}
        </Badge>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Deal Name</TableHead>
            <TableHead className="text-right">Amount</TableHead>
            <TableHead className="text-center">Probability</TableHead>
            <TableHead>Expected Close</TableHead>
            <TableHead>Owner</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {deals.map((deal) => (
            <DealRow
              key={deal.id}
              deal={deal}
              currency={currency}
              onDealClick={onDealClick}
              showAiInsights={category !== "closed"}
            />
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

export function ForecastTable({
  deals,
  closedDeals = [],
  totals,
  className,
  currency = "USD",
  onDealClick,
}: ForecastTableProps) {
  const allCategories = [
    { key: "closed" as const, deals: closedDeals, total: totals.closed },
    { key: "committed" as const, deals: deals.committed, total: totals.committed },
    { key: "bestCase" as const, deals: deals.bestCase, total: totals.bestCase },
    { key: "pipeline" as const, deals: deals.pipeline, total: totals.pipeline },
    { key: "omitted" as const, deals: deals.omitted, total: totals.omitted },
  ];

  // Calculate weighted pipeline value
  const weightedValue = [
    ...deals.committed.map((d) => d.amount * (d.aiAdjustedProbability || d.probability) / 100),
    ...deals.bestCase.map((d) => d.amount * (d.aiAdjustedProbability || d.probability) / 100),
    ...deals.pipeline.map((d) => d.amount * (d.aiAdjustedProbability || d.probability) / 100),
  ].reduce((sum, val) => sum + val, 0);

  return (
    <Card className={cn("", className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Deals by Forecast Category</CardTitle>
            <CardDescription>
              Deals categorized by close probability
            </CardDescription>
          </div>
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Weighted Pipeline</p>
            <p className="text-xl font-bold">{formatCurrency(weightedValue, currency)}</p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="committed" className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            {allCategories.map(({ key, deals: categoryDeals }) => {
              const config = CATEGORY_CONFIG[key];
              return (
                <TabsTrigger
                  key={key}
                  value={key}
                  className="flex items-center gap-1 text-xs"
                >
                  <config.icon className="h-3 w-3" />
                  <span className="hidden sm:inline">{config.label}</span>
                  <Badge variant="secondary" className="ml-1 text-xs">
                    {categoryDeals.length}
                  </Badge>
                </TabsTrigger>
              );
            })}
          </TabsList>

          {allCategories.map(({ key, deals: categoryDeals, total }) => (
            <TabsContent key={key} value={key} className="mt-4">
              <div className="mb-4 p-3 rounded-lg bg-muted/50">
                <p className="text-sm text-muted-foreground">
                  {CATEGORY_CONFIG[key].description}
                </p>
              </div>
              <CategoryTable
                category={key}
                deals={categoryDeals}
                total={total}
                currency={currency}
                onDealClick={onDealClick}
              />
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>
    </Card>
  );
}
