"use client";

import Link from "next/link";
import { Building2, Calendar, TrendingUp, MoreHorizontal } from "lucide-react";
import { cn, formatCurrency, formatDate, formatRelativeTime } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Id, Doc } from "../../../convex/_generated/dataModel";

interface DealListItem extends Doc<"deals"> {
  company: Doc<"companies"> | null;
  pipeline: Doc<"pipelines"> | null;
  stageName: string;
  stageColor: string;
}

interface DealListProps {
  deals: DealListItem[];
  onDealClick?: (dealId: Id<"deals">) => void;
  onMarkWon?: (dealId: Id<"deals">) => void;
  onMarkLost?: (dealId: Id<"deals">) => void;
  onDelete?: (dealId: Id<"deals">) => void;
}

export function DealList({
  deals,
  onDealClick,
  onMarkWon,
  onMarkLost,
  onDelete,
}: DealListProps) {
  if (deals.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="mb-4 rounded-full bg-zinc-100 p-4 dark:bg-zinc-800">
          <TrendingUp className="h-8 w-8 text-zinc-400" />
        </div>
        <h3 className="mb-1 text-lg font-medium text-zinc-900 dark:text-zinc-100">
          No deals found
        </h3>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Create your first deal to get started
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
      <table className="w-full">
        <thead>
          <tr className="border-b border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900/50">
            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              Deal
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              Company
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              Stage
            </th>
            <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              Amount
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              Close Date
            </th>
            <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              Probability
            </th>
            <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
          {deals.map((deal) => (
            <tr
              key={deal._id}
              className="group transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
            >
              {/* Deal Name */}
              <td className="px-4 py-3">
                <Link
                  href={`/deals/${deal._id}`}
                  className="block"
                  onClick={(e) => {
                    if (onDealClick) {
                      e.preventDefault();
                      onDealClick(deal._id);
                    }
                  }}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        "h-2 w-2 rounded-full",
                        deal.status === "won" && "bg-emerald-500",
                        deal.status === "lost" && "bg-red-500",
                        deal.status === "open" && "bg-blue-500"
                      )}
                    />
                    <div>
                      <p className="font-medium text-zinc-900 dark:text-zinc-100">
                        {deal.name}
                      </p>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400">
                        {formatRelativeTime(deal.createdAt)}
                      </p>
                    </div>
                  </div>
                </Link>
              </td>

              {/* Company */}
              <td className="px-4 py-3">
                {deal.company ? (
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-zinc-400" />
                    <span className="text-sm text-zinc-700 dark:text-zinc-300">
                      {deal.company.name}
                    </span>
                  </div>
                ) : (
                  <span className="text-sm text-zinc-400">-</span>
                )}
              </td>

              {/* Stage */}
              <td className="px-4 py-3">
                <div className="flex items-center gap-2">
                  <div
                    className="h-2 w-2 rounded-full"
                    style={{ backgroundColor: deal.stageColor }}
                  />
                  <span className="text-sm text-zinc-700 dark:text-zinc-300">
                    {deal.stageName}
                  </span>
                </div>
              </td>

              {/* Amount */}
              <td className="px-4 py-3 text-right">
                <span className="font-medium text-zinc-900 dark:text-zinc-100">
                  {deal.amount !== undefined
                    ? formatCurrency(deal.amount, deal.currency)
                    : "-"}
                </span>
              </td>

              {/* Close Date */}
              <td className="px-4 py-3">
                {deal.expectedCloseDate ? (
                  <div className="flex items-center gap-1 text-sm text-zinc-700 dark:text-zinc-300">
                    <Calendar className="h-3.5 w-3.5 text-zinc-400" />
                    {formatDate(deal.expectedCloseDate)}
                  </div>
                ) : (
                  <span className="text-sm text-zinc-400">-</span>
                )}
              </td>

              {/* Probability */}
              <td className="px-4 py-3">
                <div className="flex items-center justify-center gap-2">
                  <div className="h-1.5 w-16 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-700">
                    <div
                      className={cn(
                        "h-full rounded-full",
                        (deal.probability ?? 0) >= 75 && "bg-emerald-500",
                        (deal.probability ?? 0) >= 50 &&
                          (deal.probability ?? 0) < 75 &&
                          "bg-amber-500",
                        (deal.probability ?? 0) < 50 && "bg-zinc-400"
                      )}
                      style={{ width: `${deal.probability ?? 0}%` }}
                    />
                  </div>
                  <span className="text-xs text-zinc-500 dark:text-zinc-400 w-8">
                    {deal.probability ?? 0}%
                  </span>
                </div>
              </td>

              {/* Actions */}
              <td className="px-4 py-3 text-right">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 opacity-0 group-hover:opacity-100"
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem asChild>
                      <Link href={`/deals/${deal._id}`}>View Details</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href={`/deals/${deal._id}?edit=true`}>Edit</Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    {deal.status === "open" && (
                      <>
                        <DropdownMenuItem
                          onClick={() => onMarkWon?.(deal._id)}
                          className="text-emerald-600"
                        >
                          Mark as Won
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => onMarkLost?.(deal._id)}
                          className="text-red-600"
                        >
                          Mark as Lost
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                      </>
                    )}
                    <DropdownMenuItem
                      onClick={() => onDelete?.(deal._id)}
                      className="text-red-600"
                    >
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
