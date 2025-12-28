"use client";

import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

interface CreateDealDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pipelineId?: Id<"pipelines">;
  defaultStageId?: string;
  onSuccess?: (dealId: Id<"deals">) => void;
}

export function CreateDealDialog({
  open,
  onOpenChange,
  pipelineId,
  defaultStageId,
  onSuccess,
}: CreateDealDialogProps) {
  const pipelines = useQuery(api.pipelines.list, {});
  const companies = useQuery(api.companies.list, { paginationOpts: { cursor: undefined, numItems: 100 }});
  const createDeal = useMutation(api.deals.create);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    amount: "",
    pipelineId: pipelineId || "",
    stageId: defaultStageId || "",
    companyId: "",
    expectedCloseDate: "",
    probability: "",
  });

  const selectedPipeline = pipelines?.find(
    (p) => p._id === formData.pipelineId
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.pipelineId || !formData.stageId) {
      return;
    }

    setIsSubmitting(true);
    try {
      const dealId = await createDeal({
        name: formData.name,
        pipelineId: formData.pipelineId as Id<"pipelines">,
        stageId: formData.stageId,
        amount: formData.amount ? parseFloat(formData.amount) : undefined,
        companyId: formData.companyId
          ? (formData.companyId as Id<"companies">)
          : undefined,
        expectedCloseDate: formData.expectedCloseDate
          ? new Date(formData.expectedCloseDate).getTime()
          : undefined,
        probability: formData.probability
          ? parseInt(formData.probability)
          : undefined,
      });

      onSuccess?.(dealId);
      onOpenChange(false);
      resetForm();
    } catch (error) {
      console.error("Failed to create deal:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      amount: "",
      pipelineId: pipelineId || "",
      stageId: defaultStageId || "",
      companyId: "",
      expectedCloseDate: "",
      probability: "",
    });
  };

  // Set default pipeline when pipelines load
  if (pipelines?.length && !formData.pipelineId) {
    const defaultPipeline = pipelines.find((p) => p.isDefault) || pipelines[0];
    if (defaultPipeline) {
      setFormData((prev) => ({
        ...prev,
        pipelineId: defaultPipeline._id,
        stageId: defaultPipeline.stages[0]?.id || "",
      }));
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Create New Deal</DialogTitle>
            <DialogDescription>
              Add a new deal to your pipeline. Fill in the details below.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            {/* Deal Name */}
            <div className="grid gap-2">
              <Label htmlFor="name">Deal Name *</Label>
              <Input
                id="name"
                placeholder="Enter deal name"
                value={formData.name}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, name: e.target.value }))
                }
                required
              />
            </div>

            {/* Amount */}
            <div className="grid gap-2">
              <Label htmlFor="amount">Amount</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500">
                  $
                </span>
                <Input
                  id="amount"
                  type="number"
                  placeholder="0"
                  className="pl-7"
                  value={formData.amount}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, amount: e.target.value }))
                  }
                />
              </div>
            </div>

            {/* Pipeline */}
            <div className="grid gap-2">
              <Label htmlFor="pipeline">Pipeline *</Label>
              <Select
                value={formData.pipelineId}
                onValueChange={(value) =>
                  setFormData((prev) => ({
                    ...prev,
                    pipelineId: value,
                    stageId:
                      pipelines?.find((p) => p._id === value)?.stages[0]?.id ||
                      "",
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select pipeline" />
                </SelectTrigger>
                <SelectContent>
                  {pipelines?.map((pipeline) => (
                    <SelectItem key={pipeline._id} value={pipeline._id}>
                      {pipeline.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Stage */}
            <div className="grid gap-2">
              <Label htmlFor="stage">Stage *</Label>
              <Select
                value={formData.stageId}
                onValueChange={(value) =>
                  setFormData((prev) => ({ ...prev, stageId: value }))
                }
                disabled={!selectedPipeline}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select stage" />
                </SelectTrigger>
                <SelectContent>
                  {selectedPipeline?.stages.map((stage) => (
                    <SelectItem key={stage.id} value={stage.id}>
                      <div className="flex items-center gap-2">
                        <div
                          className="h-2 w-2 rounded-full"
                          style={{ backgroundColor: stage.color }}
                        />
                        {stage.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Company */}
            <div className="grid gap-2">
              <Label htmlFor="company">Company</Label>
              <Select
                value={formData.companyId}
                onValueChange={(value) =>
                  setFormData((prev) => ({ ...prev, companyId: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select company" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">No company</SelectItem>
                  {companies?.page?.map((company) => (
                    <SelectItem key={company._id} value={company._id}>
                      {company.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Expected Close Date */}
            <div className="grid gap-2">
              <Label htmlFor="expectedCloseDate">Expected Close Date</Label>
              <Input
                id="expectedCloseDate"
                type="date"
                value={formData.expectedCloseDate}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    expectedCloseDate: e.target.value,
                  }))
                }
              />
            </div>

            {/* Probability */}
            <div className="grid gap-2">
              <Label htmlFor="probability">Probability (%)</Label>
              <Input
                id="probability"
                type="number"
                min="0"
                max="100"
                placeholder="50"
                value={formData.probability}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    probability: e.target.value,
                  }))
                }
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Creating..." : "Create Deal"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
