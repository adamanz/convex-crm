"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { Loader2, Save, X, Play, CheckCircle2, XCircle } from "lucide-react";
import { RuleTypeSelector, type RuleType } from "./RuleTypeSelector";
import { RuleConfigEditor, type RuleConfig } from "./RuleConfigEditor";

interface ValidationRuleFormProps {
  ruleId?: Id<"validationRules">;
  onSave: () => void;
  onCancel: () => void;
}

// Field options for each entity type
const ENTITY_FIELDS: Record<string, Array<{ value: string; label: string }>> = {
  contact: [
    { value: "firstName", label: "First Name" },
    { value: "lastName", label: "Last Name" },
    { value: "email", label: "Email" },
    { value: "phone", label: "Phone" },
    { value: "title", label: "Title" },
    { value: "source", label: "Source" },
    { value: "linkedinUrl", label: "LinkedIn URL" },
    { value: "twitterHandle", label: "Twitter Handle" },
    { value: "address.street", label: "Street Address" },
    { value: "address.city", label: "City" },
    { value: "address.state", label: "State" },
    { value: "address.postalCode", label: "Postal Code" },
    { value: "address.country", label: "Country" },
  ],
  company: [
    { value: "name", label: "Company Name" },
    { value: "domain", label: "Domain" },
    { value: "industry", label: "Industry" },
    { value: "size", label: "Company Size" },
    { value: "annualRevenue", label: "Annual Revenue" },
    { value: "phone", label: "Phone" },
    { value: "website", label: "Website" },
    { value: "address.street", label: "Street Address" },
    { value: "address.city", label: "City" },
    { value: "address.state", label: "State" },
    { value: "address.postalCode", label: "Postal Code" },
    { value: "address.country", label: "Country" },
  ],
  deal: [
    { value: "name", label: "Deal Name" },
    { value: "amount", label: "Amount" },
    { value: "probability", label: "Probability" },
    { value: "currency", label: "Currency" },
    { value: "status", label: "Status" },
    { value: "lostReason", label: "Lost Reason" },
  ],
};

export function ValidationRuleForm({
  ruleId,
  onSave,
  onCancel,
}: ValidationRuleFormProps) {
  const isEditing = Boolean(ruleId);

  // Fetch existing rule if editing
  const existingRule = useQuery(
    api.validation.getRule,
    ruleId ? { id: ruleId } : "skip"
  );

  // Mutations
  const createRule = useMutation(api.validation.createRule);
  const updateRule = useMutation(api.validation.updateRule);
  const testRule = useQuery(api.validation.testRule, "skip");

  // Form state
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [entityType, setEntityType] = useState<"contact" | "company" | "deal">("contact");
  const [field, setField] = useState("");
  const [ruleType, setRuleType] = useState<RuleType>("required");
  const [config, setConfig] = useState<RuleConfig>({});
  const [errorMessage, setErrorMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // Test state
  const [testValue, setTestValue] = useState("");
  const [testResult, setTestResult] = useState<{ isValid: boolean; error?: string } | null>(null);
  const [isTesting, setIsTesting] = useState(false);

  // Load existing rule data
  useEffect(() => {
    if (existingRule) {
      setName(existingRule.name);
      setDescription(existingRule.description || "");
      setEntityType(existingRule.entityType);
      setField(existingRule.field);
      setRuleType(existingRule.ruleType);
      setConfig(existingRule.config);
      setErrorMessage(existingRule.errorMessage);
    }
  }, [existingRule]);

  // Reset config when rule type changes
  useEffect(() => {
    if (!isEditing) {
      setConfig({});
      // Set default error message based on rule type
      const defaults: Record<RuleType, string> = {
        required: `${field || "This field"} is required`,
        format: `${field || "This field"} has an invalid format`,
        range: `${field || "This field"} is outside the allowed range`,
        regex: `${field || "This field"} does not match the required pattern`,
        unique: `${field || "This field"} must be unique`,
        lookup: `${field || "This field"} must be one of the allowed values`,
      };
      setErrorMessage(defaults[ruleType]);
    }
  }, [ruleType, isEditing, field]);

  const handleTest = async () => {
    setIsTesting(true);
    try {
      // We'll simulate the test locally since we can't call queries with dynamic args
      const mockResult = simulateTest(ruleType, config, testValue);
      setTestResult(mockResult);
    } catch (error) {
      console.error("Test failed:", error);
      setTestResult({ isValid: false, error: "Test failed" });
    } finally {
      setIsTesting(false);
    }
  };

  // Local test simulation
  const simulateTest = (
    type: RuleType,
    cfg: RuleConfig,
    value: string
  ): { isValid: boolean; error?: string } => {
    switch (type) {
      case "required":
        if (!value || value.trim() === "") {
          return { isValid: false, error: errorMessage };
        }
        break;
      case "format":
        if (value) {
          const patterns = {
            email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
            phone: /^[+]?[\d\s\-().]{7,}$/,
            url: /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?$/,
          };
          const pattern = patterns[cfg.formatType as keyof typeof patterns];
          if (pattern && !pattern.test(value)) {
            return { isValid: false, error: errorMessage };
          }
        }
        break;
      case "range":
        if (value) {
          const num = Number(value);
          if (isNaN(num)) {
            return { isValid: false, error: "Value must be a number" };
          }
          if (cfg.min !== undefined && num < cfg.min) {
            return { isValid: false, error: errorMessage };
          }
          if (cfg.max !== undefined && num > cfg.max) {
            return { isValid: false, error: errorMessage };
          }
        }
        break;
      case "regex":
        if (value && cfg.pattern) {
          try {
            const regex = new RegExp(cfg.pattern);
            if (!regex.test(value)) {
              return { isValid: false, error: errorMessage };
            }
          } catch {
            return { isValid: false, error: "Invalid regex pattern" };
          }
        }
        break;
      case "lookup":
        if (value && cfg.allowedValues) {
          if (!cfg.allowedValues.includes(value)) {
            return { isValid: false, error: errorMessage };
          }
        }
        break;
      case "unique":
        // Can't test unique validation locally
        return { isValid: true, error: "Unique validation requires database check" };
    }
    return { isValid: true };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error("Please enter a rule name");
      return;
    }
    if (!field) {
      toast.error("Please select a field");
      return;
    }
    if (!errorMessage.trim()) {
      toast.error("Please enter an error message");
      return;
    }

    setIsSaving(true);
    try {
      if (isEditing && ruleId) {
        await updateRule({
          id: ruleId,
          name,
          description: description || undefined,
          field,
          ruleType,
          config,
          errorMessage,
        });
        toast.success("Validation rule updated");
      } else {
        await createRule({
          name,
          description: description || undefined,
          entityType,
          field,
          ruleType,
          config,
          errorMessage,
        });
        toast.success("Validation rule created");
      }
      onSave();
    } catch (error) {
      console.error("Failed to save rule:", error);
      toast.error("Failed to save validation rule");
    } finally {
      setIsSaving(false);
    }
  };

  const availableFields = ENTITY_FIELDS[entityType] || [];

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic Info */}
      <Card>
        <CardHeader>
          <CardTitle>Rule Details</CardTitle>
          <CardDescription>
            Basic information about the validation rule.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Rule Name <span className="text-destructive">*</span></Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Email Required for Contacts"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe what this rule validates..."
              rows={2}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="entityType">Entity Type <span className="text-destructive">*</span></Label>
              <Select
                value={entityType}
                onValueChange={(v) => {
                  setEntityType(v as typeof entityType);
                  setField(""); // Reset field when entity type changes
                }}
                disabled={isEditing}
              >
                <SelectTrigger id="entityType">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="contact">Contact</SelectItem>
                  <SelectItem value="company">Company</SelectItem>
                  <SelectItem value="deal">Deal</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="field">Field <span className="text-destructive">*</span></Label>
              <Select value={field} onValueChange={setField}>
                <SelectTrigger id="field">
                  <SelectValue placeholder="Select a field" />
                </SelectTrigger>
                <SelectContent>
                  {availableFields.map((f) => (
                    <SelectItem key={f.value} value={f.value}>
                      {f.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Rule Type */}
      <Card>
        <CardHeader>
          <CardTitle>Validation Type</CardTitle>
          <CardDescription>
            Select the type of validation to apply.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <RuleTypeSelector
            value={ruleType}
            onChange={setRuleType}
            disabled={isEditing}
          />

          <Separator />

          <RuleConfigEditor
            ruleType={ruleType}
            config={config}
            onChange={setConfig}
          />
        </CardContent>
      </Card>

      {/* Error Message */}
      <Card>
        <CardHeader>
          <CardTitle>Error Message</CardTitle>
          <CardDescription>
            The message to display when validation fails.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="errorMessage">Message <span className="text-destructive">*</span></Label>
            <Textarea
              id="errorMessage"
              value={errorMessage}
              onChange={(e) => setErrorMessage(e.target.value)}
              placeholder="Enter the error message..."
              rows={2}
              required
            />
          </div>
        </CardContent>
      </Card>

      {/* Test Rule */}
      <Card>
        <CardHeader>
          <CardTitle>Test Rule</CardTitle>
          <CardDescription>
            Test this rule with a sample value.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              value={testValue}
              onChange={(e) => {
                setTestValue(e.target.value);
                setTestResult(null);
              }}
              placeholder="Enter a test value..."
              className="flex-1"
            />
            <Button
              type="button"
              variant="outline"
              onClick={handleTest}
              disabled={isTesting}
            >
              {isTesting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Play className="h-4 w-4" />
              )}
              Test
            </Button>
          </div>

          {testResult && (
            <div
              className={`flex items-center gap-2 rounded-lg p-3 ${
                testResult.isValid
                  ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400"
                  : "bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-400"
              }`}
            >
              {testResult.isValid ? (
                <>
                  <CheckCircle2 className="h-5 w-5" />
                  <span>Validation passed</span>
                </>
              ) : (
                <>
                  <XCircle className="h-5 w-5" />
                  <span>{testResult.error}</span>
                </>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex justify-end gap-3">
        <Button type="button" variant="outline" onClick={onCancel}>
          <X className="h-4 w-4" />
          Cancel
        </Button>
        <Button type="submit" disabled={isSaving}>
          {isSaving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          {isEditing ? "Update Rule" : "Create Rule"}
        </Button>
      </div>
    </form>
  );
}

export default ValidationRuleForm;
