"use client";

import * as React from "react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Users,
  Building2,
  TrendingUp,
  Check,
  ArrowRight,
  ArrowLeft,
  Loader2,
  Plus,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface SetupWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete: (data: SetupData) => void;
}

interface SetupData {
  pipelineName?: string;
  contactName?: string;
  contactEmail?: string;
  companyName?: string;
}

const steps = [
  {
    id: "pipeline",
    title: "Create Your Pipeline",
    description: "Set up a sales pipeline to track your deals",
    icon: TrendingUp,
    color: "text-emerald-500",
    bgColor: "bg-emerald-50 dark:bg-emerald-950/30",
  },
  {
    id: "contact",
    title: "Add Your First Contact",
    description: "Start building your relationship database",
    icon: Users,
    color: "text-blue-500",
    bgColor: "bg-blue-50 dark:bg-blue-950/30",
  },
  {
    id: "company",
    title: "Add a Company",
    description: "Track companies and organizations",
    icon: Building2,
    color: "text-violet-500",
    bgColor: "bg-violet-50 dark:bg-violet-950/30",
  },
];

export function SetupWizard({ open, onOpenChange, onComplete }: SetupWizardProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<SetupData>({
    pipelineName: "Sales Pipeline",
    contactName: "",
    contactEmail: "",
    companyName: "",
  });

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = async () => {
    setIsSubmitting(true);
    try {
      await onComplete(formData);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSkipStep = () => {
    // Clear data for current step and move on
    if (currentStep === 0) {
      setFormData((prev) => ({ ...prev, pipelineName: "" }));
    } else if (currentStep === 1) {
      setFormData((prev) => ({ ...prev, contactName: "", contactEmail: "" }));
    } else if (currentStep === 2) {
      setFormData((prev) => ({ ...prev, companyName: "" }));
    }
    handleNext();
  };

  const isStepValid = () => {
    if (currentStep === 0) {
      return formData.pipelineName && formData.pipelineName.trim().length > 0;
    }
    // Other steps are optional
    return true;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl gap-0 overflow-hidden p-0">
        {/* Progress Header */}
        <div className="border-b border-zinc-200 bg-zinc-50 p-6 dark:border-zinc-800 dark:bg-zinc-900/50">
          <DialogHeader className="pb-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-r from-blue-500 to-violet-500">
                <Sparkles className="h-5 w-5 text-white" />
              </div>
              <div>
                <DialogTitle className="text-lg">Quick Setup</DialogTitle>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">
                  Step {currentStep + 1} of {steps.length}
                </p>
              </div>
            </div>
          </DialogHeader>

          {/* Progress Steps */}
          <div className="flex items-center justify-between">
            {steps.map((step, index) => {
              const StepIcon = step.icon;
              const isComplete = index < currentStep;
              const isCurrent = index === currentStep;

              return (
                <React.Fragment key={step.id}>
                  <div className="flex items-center gap-2">
                    <div
                      className={cn(
                        "flex h-8 w-8 items-center justify-center rounded-full transition-colors",
                        isComplete
                          ? "bg-emerald-500 text-white"
                          : isCurrent
                            ? step.bgColor
                            : "bg-zinc-200 dark:bg-zinc-800"
                      )}
                    >
                      {isComplete ? (
                        <Check className="h-4 w-4" />
                      ) : (
                        <StepIcon
                          className={cn(
                            "h-4 w-4",
                            isCurrent
                              ? step.color
                              : "text-zinc-400 dark:text-zinc-500"
                          )}
                        />
                      )}
                    </div>
                    <span
                      className={cn(
                        "hidden text-sm font-medium sm:block",
                        isCurrent
                          ? "text-zinc-900 dark:text-zinc-50"
                          : "text-zinc-400 dark:text-zinc-500"
                      )}
                    >
                      {step.title}
                    </span>
                  </div>
                  {index < steps.length - 1 && (
                    <div
                      className={cn(
                        "h-0.5 flex-1 mx-2",
                        index < currentStep
                          ? "bg-emerald-500"
                          : "bg-zinc-200 dark:bg-zinc-800"
                      )}
                    />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>

        {/* Step Content */}
        <div className="p-6">
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
              {steps[currentStep].title}
            </h2>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
              {steps[currentStep].description}
            </p>
          </div>

          {/* Pipeline Step */}
          {currentStep === 0 && (
            <div className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="pipelineName">Pipeline Name</Label>
                <Input
                  id="pipelineName"
                  placeholder="e.g., Sales Pipeline, Enterprise Sales"
                  value={formData.pipelineName}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, pipelineName: e.target.value }))
                  }
                />
                <p className="text-xs text-zinc-500">
                  This will be your main sales pipeline. You can create more later.
                </p>
              </div>

              <Card className="border-dashed border-zinc-300 bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900/50">
                <CardContent className="p-4">
                  <h4 className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                    Default stages included:
                  </h4>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {["Lead", "Qualified", "Proposal", "Negotiation", "Won"].map(
                      (stage) => (
                        <span
                          key={stage}
                          className="rounded-full bg-white px-3 py-1 text-xs font-medium text-zinc-600 shadow-sm dark:bg-zinc-800 dark:text-zinc-300"
                        >
                          {stage}
                        </span>
                      )
                    )}
                  </div>
                  <p className="mt-3 text-xs text-zinc-500">
                    You can customize these stages anytime in Settings.
                  </p>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Contact Step */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="contactName">Contact Name</Label>
                  <Input
                    id="contactName"
                    placeholder="e.g., John Smith"
                    value={formData.contactName}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, contactName: e.target.value }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contactEmail">Email (optional)</Label>
                  <Input
                    id="contactEmail"
                    type="email"
                    placeholder="e.g., john@company.com"
                    value={formData.contactEmail}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, contactEmail: e.target.value }))
                    }
                  />
                </div>
              </div>

              <div className="flex items-center gap-3 rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-900 dark:bg-blue-950/30">
                <Users className="h-5 w-5 text-blue-500" />
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  Tip: You can import contacts from CSV or add them manually later.
                </p>
              </div>
            </div>
          )}

          {/* Company Step */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="companyName">Company Name</Label>
                <Input
                  id="companyName"
                  placeholder="e.g., Acme Corporation"
                  value={formData.companyName}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, companyName: e.target.value }))
                  }
                />
              </div>

              <div className="flex items-center gap-3 rounded-lg border border-violet-200 bg-violet-50 p-4 dark:border-violet-900 dark:bg-violet-950/30">
                <Building2 className="h-5 w-5 text-violet-500" />
                <p className="text-sm text-violet-700 dark:text-violet-300">
                  Companies help you organize contacts and track deals by account.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between border-t border-zinc-200 bg-zinc-50 p-6 dark:border-zinc-800 dark:bg-zinc-900/50">
          <div>
            {currentStep > 0 && (
              <Button variant="ghost" onClick={handleBack}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
            )}
          </div>
          <div className="flex items-center gap-3">
            {currentStep > 0 && (
              <Button variant="ghost" onClick={handleSkipStep}>
                Skip this step
              </Button>
            )}
            <Button onClick={handleNext} disabled={!isStepValid() || isSubmitting}>
              {isSubmitting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : currentStep === steps.length - 1 ? (
                <>
                  Complete Setup
                  <Check className="ml-2 h-4 w-4" />
                </>
              ) : (
                <>
                  Continue
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
