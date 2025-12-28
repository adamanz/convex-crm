"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertTriangle,
  CheckCircle2,
  ExternalLink,
  RefreshCw,
  Users,
  Building2,
  DollarSign,
} from "lucide-react";
import Link from "next/link";

interface ViolationListProps {
  ruleId?: Id<"validationRules">;
  entityType?: "contact" | "company" | "deal";
  onClose?: () => void;
}

const ENTITY_ICONS = {
  contact: Users,
  company: Building2,
  deal: DollarSign,
};

const ENTITY_LINKS = {
  contact: "/contacts",
  company: "/companies",
  deal: "/deals",
};

export function ViolationList({
  ruleId,
  entityType: initialEntityType,
  onClose,
}: ViolationListProps) {
  const [entityType, setEntityType] = useState<"contact" | "company" | "deal">(
    initialEntityType || "contact"
  );
  const [limit, setLimit] = useState(50);

  // Get the rule details if viewing violations for a specific rule
  const rule = useQuery(
    api.validation.getRule,
    ruleId ? { id: ruleId } : "skip"
  );

  // Get violations
  const violations = useQuery(api.validation.getViolations, {
    entityType: rule?.entityType || entityType,
    ruleId,
    limit,
  });

  // Get validation stats
  const stats = useQuery(api.validation.getValidationStats, {
    entityType: rule?.entityType || entityType,
  });

  const currentEntityType = rule?.entityType || entityType;
  const EntityIcon = ENTITY_ICONS[currentEntityType];

  if (!violations) {
    return <ViolationListSkeleton />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
            {rule ? `Violations: ${rule.name}` : "Data Quality Violations"}
          </h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            {rule
              ? `Entities failing the "${rule.field}" validation rule`
              : "Entities with validation errors"}
          </p>
        </div>

        {!ruleId && (
          <Select
            value={entityType}
            onValueChange={(v) => setEntityType(v as typeof entityType)}
          >
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="contact">Contacts</SelectItem>
              <SelectItem value="company">Companies</SelectItem>
              <SelectItem value="deal">Deals</SelectItem>
            </SelectContent>
          </Select>
        )}
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid gap-4 sm:grid-cols-3">
          <Card>
            <CardContent className="flex items-center gap-3 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-zinc-100 dark:bg-zinc-800">
                <EntityIcon className="h-5 w-5 text-zinc-500" />
              </div>
              <div>
                <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                  Total Entities
                </p>
                <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                  {stats.entityCount}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex items-center gap-3 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-950">
                <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                  Violations Found
                </p>
                <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                  {violations.totalCount}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex items-center gap-3 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-950">
                <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                  Active Rules
                </p>
                <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                  {stats.activeRules}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Violations Table */}
      {violations.violations.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-950">
              <CheckCircle2 className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
            </div>
            <h3 className="mt-4 text-lg font-medium text-zinc-900 dark:text-zinc-100">
              No violations found
            </h3>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
              All {currentEntityType}s pass the active validation rules.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Entities with Errors</CardTitle>
            <CardDescription>
              {violations.totalCount} {currentEntityType}
              {violations.totalCount !== 1 ? "s" : ""} with validation errors
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Errors</TableHead>
                  <TableHead className="w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {violations.violations.map((violation) => (
                  <TableRow key={violation.entityId}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <EntityIcon className="h-4 w-4 text-zinc-400" />
                        <span className="font-medium">{violation.entityName}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {violation.errors.map((error, i) => (
                          <Badge
                            key={i}
                            variant="secondary"
                            className="bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400"
                          >
                            {error.field}: {error.ruleName}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Link
                        href={`${ENTITY_LINKS[currentEntityType]}/${violation.entityId}`}
                      >
                        <Button variant="ghost" size="sm">
                          <ExternalLink className="h-4 w-4" />
                          View
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {violations.totalCount >= limit && (
              <div className="mt-4 flex justify-center">
                <Button
                  variant="outline"
                  onClick={() => setLimit((l) => l + 50)}
                >
                  Load More
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      {onClose && (
        <div className="flex justify-end">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      )}
    </div>
  );
}

function ViolationListSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Skeleton className="h-10 w-[140px]" />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardContent className="flex items-center gap-3 p-4">
              <Skeleton className="h-10 w-10 rounded-lg" />
              <div className="space-y-1">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-8 w-16" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-4 w-56" />
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default ViolationList;
