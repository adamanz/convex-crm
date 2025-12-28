"use client";

import * as React from "react";
import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  Users,
  Building2,
  TrendingUp,
  MessageSquare,
  Calendar,
  LayoutDashboard,
  ChevronRight,
  ChevronLeft,
  X,
  Lightbulb,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface TourStep {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  bgColor: string;
  tips: string[];
  targetPath?: string;
}

const tourSteps: TourStep[] = [
  {
    id: "dashboard",
    title: "Dashboard Overview",
    description:
      "Your command center showing key metrics, recent activity, and upcoming tasks at a glance.",
    icon: LayoutDashboard,
    color: "text-indigo-500",
    bgColor: "bg-indigo-50 dark:bg-indigo-950/30",
    tips: [
      "Check daily stats and performance",
      "View recent activities across your CRM",
      "Quick access to important items",
    ],
    targetPath: "/",
  },
  {
    id: "contacts",
    title: "Contact Management",
    description:
      "Store and manage all your contacts. Track interactions, notes, and relationship history.",
    icon: Users,
    color: "text-blue-500",
    bgColor: "bg-blue-50 dark:bg-blue-950/30",
    tips: [
      "Add tags to organize contacts",
      "Link contacts to companies and deals",
      "Track activity history for each contact",
    ],
    targetPath: "/contacts",
  },
  {
    id: "companies",
    title: "Company Accounts",
    description:
      "Organize contacts by company and track account-level information and deals.",
    icon: Building2,
    color: "text-violet-500",
    bgColor: "bg-violet-50 dark:bg-violet-950/30",
    tips: [
      "Group related contacts together",
      "Track company size and industry",
      "View all deals per company",
    ],
    targetPath: "/companies",
  },
  {
    id: "deals",
    title: "Sales Pipeline",
    description:
      "Visual kanban board to track deals through your sales process from lead to close.",
    icon: TrendingUp,
    color: "text-emerald-500",
    bgColor: "bg-emerald-50 dark:bg-emerald-950/30",
    tips: [
      "Drag and drop deals between stages",
      "Set expected close dates",
      "Track deal values and win rates",
    ],
    targetPath: "/deals",
  },
  {
    id: "activities",
    title: "Tasks & Activities",
    description:
      "Keep track of tasks, calls, meetings, and notes. Never miss a follow-up again.",
    icon: Calendar,
    color: "text-amber-500",
    bgColor: "bg-amber-50 dark:bg-amber-950/30",
    tips: [
      "Set due dates and priorities",
      "Link activities to contacts and deals",
      "Track call logs and meeting notes",
    ],
    targetPath: "/activities",
  },
  {
    id: "conversations",
    title: "Conversations",
    description:
      "View and manage all your message threads and communication history in one place.",
    icon: MessageSquare,
    color: "text-rose-500",
    bgColor: "bg-rose-50 dark:bg-rose-950/30",
    tips: [
      "Send and receive messages",
      "Search conversation history",
      "Link conversations to contacts",
    ],
    targetPath: "/conversations",
  },
];

interface FeatureTourProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onNavigate?: (path: string) => void;
  className?: string;
}

export function FeatureTour({
  open,
  onOpenChange,
  onNavigate,
  className,
}: FeatureTourProps) {
  const [currentStep, setCurrentStep] = useState(0);

  const handleNext = useCallback(() => {
    if (currentStep < tourSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onOpenChange(false);
    }
  }, [currentStep, onOpenChange]);

  const handlePrev = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  }, [currentStep]);

  const handleClose = useCallback(() => {
    onOpenChange(false);
  }, [onOpenChange]);

  const handleNavigate = useCallback(() => {
    const step = tourSteps[currentStep];
    if (step.targetPath && onNavigate) {
      onNavigate(step.targetPath);
    }
  }, [currentStep, onNavigate]);

  // Keyboard navigation
  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === "Enter") {
        handleNext();
      } else if (e.key === "ArrowLeft") {
        handlePrev();
      } else if (e.key === "Escape") {
        handleClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, handleNext, handlePrev, handleClose]);

  if (!open) return null;

  const step = tourSteps[currentStep];
  const StepIcon = step.icon;

  return (
    <div
      className={cn(
        "fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm",
        className
      )}
    >
      <div className="relative mx-4 w-full max-w-lg animate-in fade-in zoom-in-95 duration-200">
        {/* Close button */}
        <button
          onClick={handleClose}
          className="absolute -right-2 -top-2 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-white shadow-lg transition-colors hover:bg-zinc-100 dark:bg-zinc-800 dark:hover:bg-zinc-700"
        >
          <X className="h-4 w-4 text-zinc-500" />
        </button>

        <div className="overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-zinc-900">
          {/* Header with icon */}
          <div className={cn("relative p-8 text-center", step.bgColor)}>
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-white shadow-lg dark:bg-zinc-800">
              <StepIcon className={cn("h-8 w-8", step.color)} />
            </div>
            <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
              {step.title}
            </h2>
            <p className="mt-2 text-zinc-600 dark:text-zinc-300">
              {step.description}
            </p>
          </div>

          {/* Tips */}
          <div className="p-6">
            <div className="flex items-center gap-2 text-sm font-medium text-zinc-500 dark:text-zinc-400">
              <Lightbulb className="h-4 w-4" />
              <span>Tips</span>
            </div>
            <ul className="mt-3 space-y-2">
              {step.tips.map((tip, index) => (
                <li
                  key={index}
                  className="flex items-start gap-3 text-sm text-zinc-600 dark:text-zinc-300"
                >
                  <div
                    className={cn(
                      "mt-1 h-1.5 w-1.5 shrink-0 rounded-full",
                      step.color.replace("text-", "bg-")
                    )}
                  />
                  {tip}
                </li>
              ))}
            </ul>
          </div>

          {/* Progress dots and navigation */}
          <div className="flex items-center justify-between border-t border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-950">
            {/* Step indicator dots */}
            <div className="flex items-center gap-1.5">
              {tourSteps.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentStep(index)}
                  className={cn(
                    "h-2 w-2 rounded-full transition-all",
                    index === currentStep
                      ? cn("w-6", step.color.replace("text-", "bg-"))
                      : "bg-zinc-300 hover:bg-zinc-400 dark:bg-zinc-700 dark:hover:bg-zinc-600"
                  )}
                />
              ))}
            </div>

            {/* Navigation buttons */}
            <div className="flex items-center gap-2">
              {currentStep > 0 && (
                <Button variant="ghost" size="sm" onClick={handlePrev}>
                  <ChevronLeft className="mr-1 h-4 w-4" />
                  Back
                </Button>
              )}
              {step.targetPath && onNavigate && (
                <Button variant="outline" size="sm" onClick={handleNavigate}>
                  Go to {step.title.split(" ")[0]}
                </Button>
              )}
              <Button size="sm" onClick={handleNext}>
                {currentStep === tourSteps.length - 1 ? (
                  "Finish Tour"
                ) : (
                  <>
                    Next
                    <ChevronRight className="ml-1 h-4 w-4" />
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Compact version for sidebar/header
interface FeatureTourTriggerProps {
  onClick: () => void;
  className?: string;
}

export function FeatureTourTrigger({ onClick, className }: FeatureTourTriggerProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-2 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm font-medium text-zinc-700 shadow-sm transition-colors hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800",
        className
      )}
    >
      <Lightbulb className="h-4 w-4 text-amber-500" />
      Take a Tour
    </button>
  );
}
