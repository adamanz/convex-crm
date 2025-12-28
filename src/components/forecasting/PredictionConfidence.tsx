"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  Brain,
  TrendingUp,
  TrendingDown,
  Minus,
  AlertTriangle,
  CheckCircle,
  Info,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export interface PredictionFactor {
  factor: string;
  impact: number;
  description: string;
}

export interface PredictionConfidenceProps {
  confidence: number;
  factors?: PredictionFactor[];
  lastCalculatedAt?: number;
  className?: string;
}

function getConfidenceLevel(confidence: number): {
  label: string;
  color: string;
  bgColor: string;
  description: string;
} {
  if (confidence >= 80) {
    return {
      label: "High",
      color: "text-green-600",
      bgColor: "bg-green-500",
      description: "Strong confidence in prediction accuracy",
    };
  }
  if (confidence >= 60) {
    return {
      label: "Medium",
      color: "text-blue-600",
      bgColor: "bg-blue-500",
      description: "Moderate confidence in prediction",
    };
  }
  if (confidence >= 40) {
    return {
      label: "Low",
      color: "text-amber-600",
      bgColor: "bg-amber-500",
      description: "Limited confidence - consider reviewing deals",
    };
  }
  return {
    label: "Very Low",
    color: "text-red-600",
    bgColor: "bg-red-500",
    description: "Prediction reliability is uncertain",
  };
}

function ConfidenceGauge({ confidence }: { confidence: number }) {
  const level = getConfidenceLevel(confidence);
  const rotation = (confidence / 100) * 180 - 90; // -90 to 90 degrees

  return (
    <div className="relative w-32 h-16 overflow-hidden">
      {/* Background arc */}
      <div className="absolute w-32 h-32 rounded-full border-8 border-muted" />

      {/* Colored segments */}
      <div className="absolute w-32 h-32 rounded-full border-8 border-transparent border-t-red-200 border-l-red-200 rotate-[-45deg]" />
      <div className="absolute w-32 h-32 rounded-full border-8 border-transparent border-t-amber-200 rotate-[0deg]" />
      <div className="absolute w-32 h-32 rounded-full border-8 border-transparent border-t-blue-200 rotate-[45deg]" />
      <div className="absolute w-32 h-32 rounded-full border-8 border-transparent border-r-green-200 rotate-[45deg]" />

      {/* Needle */}
      <div
        className="absolute bottom-0 left-1/2 w-1 h-14 bg-gray-800 dark:bg-gray-200 origin-bottom transition-transform duration-500"
        style={{ transform: `translateX(-50%) rotate(${rotation}deg)` }}
      />

      {/* Center dot */}
      <div className="absolute bottom-0 left-1/2 w-4 h-4 -translate-x-1/2 translate-y-1/2 rounded-full bg-gray-800 dark:bg-gray-200" />
    </div>
  );
}

function ImpactBadge({ impact }: { impact: number }) {
  if (impact > 0) {
    return (
      <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
        <TrendingUp className="h-3 w-3 mr-1" />
        +{impact}%
      </Badge>
    );
  }
  if (impact < 0) {
    return (
      <Badge className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
        <TrendingDown className="h-3 w-3 mr-1" />
        {impact}%
      </Badge>
    );
  }
  return (
    <Badge variant="secondary">
      <Minus className="h-3 w-3 mr-1" />
      0%
    </Badge>
  );
}

export function PredictionConfidence({
  confidence,
  factors = [],
  lastCalculatedAt,
  className,
}: PredictionConfidenceProps) {
  const level = getConfidenceLevel(confidence);

  // Sort factors by absolute impact
  const sortedFactors = [...factors].sort(
    (a, b) => Math.abs(b.impact) - Math.abs(a.impact)
  );

  // Separate positive and negative factors
  const positiveFactors = sortedFactors.filter((f) => f.impact > 0);
  const negativeFactors = sortedFactors.filter((f) => f.impact < 0);

  return (
    <Card className={cn("", className)}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-cyan-500" />
              AI Prediction Confidence
            </CardTitle>
            <CardDescription>
              How reliable is this forecast prediction?
            </CardDescription>
          </div>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <Info className="h-4 w-4 text-muted-foreground" />
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <p>
                  Confidence is calculated based on pipeline composition,
                  deal health indicators, and historical accuracy patterns.
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center gap-4">
          {/* Confidence gauge */}
          <div className="flex flex-col items-center">
            <ConfidenceGauge confidence={confidence} />
            <div className="mt-2 text-center">
              <p className={cn("text-3xl font-bold", level.color)}>
                {confidence}%
              </p>
              <Badge className={cn("mt-1", level.bgColor, "text-white")}>
                {level.label} Confidence
              </Badge>
            </div>
            <p className="mt-2 text-sm text-muted-foreground text-center max-w-xs">
              {level.description}
            </p>
          </div>

          {/* Last calculated */}
          {lastCalculatedAt && (
            <p className="text-xs text-muted-foreground">
              Last updated: {new Date(lastCalculatedAt).toLocaleString()}
            </p>
          )}

          {/* Prediction factors */}
          {factors.length > 0 && (
            <div className="w-full mt-4 space-y-4">
              <h4 className="font-medium text-sm flex items-center gap-2">
                Contributing Factors
              </h4>

              {/* Positive factors */}
              {positiveFactors.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-green-600">
                    <CheckCircle className="h-4 w-4" />
                    <span>Positive Indicators</span>
                  </div>
                  <div className="space-y-2 pl-6">
                    {positiveFactors.map((factor, index) => (
                      <div
                        key={index}
                        className="flex items-start justify-between gap-2 text-sm"
                      >
                        <p className="text-muted-foreground flex-1">
                          {factor.description}
                        </p>
                        <ImpactBadge impact={factor.impact} />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Negative factors */}
              {negativeFactors.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-amber-600">
                    <AlertTriangle className="h-4 w-4" />
                    <span>Risk Indicators</span>
                  </div>
                  <div className="space-y-2 pl-6">
                    {negativeFactors.map((factor, index) => (
                      <div
                        key={index}
                        className="flex items-start justify-between gap-2 text-sm"
                      >
                        <p className="text-muted-foreground flex-1">
                          {factor.description}
                        </p>
                        <ImpactBadge impact={factor.impact} />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
