"use client";

import * as React from "react";
import { Mail, MessageSquare, Phone, Clock, CheckSquare } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SEQUENCE_STEP_CONFIGS, type SequenceStepData } from "./SequenceStep";

interface SequenceStepPreviewProps {
  step: SequenceStepData;
  stepNumber: number;
  className?: string;
}

export function SequenceStepPreview({
  step,
  stepNumber,
  className,
}: SequenceStepPreviewProps) {
  const config = SEQUENCE_STEP_CONFIGS[step.type];
  const Icon = config.icon;

  const formatDelay = () => {
    const parts = [];
    if (step.delayDays > 0) {
      parts.push(`${step.delayDays} day${step.delayDays !== 1 ? "s" : ""}`);
    }
    if (step.delayHours > 0) {
      parts.push(`${step.delayHours} hour${step.delayHours !== 1 ? "s" : ""}`);
    }
    return parts.length > 0 ? parts.join(" and ") : "Immediate";
  };

  const renderContent = () => {
    switch (step.type) {
      case "email":
        return (
          <div className="space-y-2">
            <div>
              <span className="text-xs font-medium text-muted-foreground">Subject:</span>
              <p className="text-sm">{step.subject || "(No subject set)"}</p>
            </div>
            {step.content && (
              <div>
                <span className="text-xs font-medium text-muted-foreground">Preview:</span>
                <p className="text-sm text-muted-foreground line-clamp-3">
                  {step.content}
                </p>
              </div>
            )}
          </div>
        );

      case "sms":
        return (
          <div>
            <span className="text-xs font-medium text-muted-foreground">Message:</span>
            <p className="text-sm mt-1 p-2 bg-muted rounded-md">
              {step.content || "(No message set)"}
            </p>
          </div>
        );

      case "call":
        return (
          <div>
            <span className="text-xs font-medium text-muted-foreground">Call Notes:</span>
            <p className="text-sm mt-1">
              {step.content || "Follow up call with the contact"}
            </p>
          </div>
        );

      case "wait":
        return (
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">
              Wait for {formatDelay()} before next step
            </span>
          </div>
        );

      case "task":
        return (
          <div>
            <span className="text-xs font-medium text-muted-foreground">Task:</span>
            <p className="text-sm mt-1">
              {step.taskDescription || "(No task description set)"}
            </p>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Card className={cn("", className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-3">
          <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium">
            {stepNumber}
          </div>
          <div
            className={cn(
              "flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-white",
              config.color
            )}
          >
            <Icon className="h-4 w-4" />
          </div>
          <div className="flex-1">
            <CardTitle className="text-sm font-medium">{config.label}</CardTitle>
            <p className="text-xs text-muted-foreground">{formatDelay()}</p>
          </div>
          <Badge variant="outline" className="text-xs">
            {step.type}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="pt-0">{renderContent()}</CardContent>
    </Card>
  );
}

// Preview list of all steps
interface SequencePreviewProps {
  steps: SequenceStepData[];
  className?: string;
}

export function SequencePreview({ steps, className }: SequencePreviewProps) {
  if (steps.length === 0) {
    return (
      <div className={cn("text-center py-8 text-muted-foreground", className)}>
        No steps in this sequence yet
      </div>
    );
  }

  return (
    <div className={cn("space-y-3", className)}>
      {steps.map((step, index) => (
        <SequenceStepPreview
          key={step.id}
          step={step}
          stepNumber={index + 1}
        />
      ))}
    </div>
  );
}
