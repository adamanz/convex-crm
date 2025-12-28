"use client";

import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";
import { format } from "date-fns";

interface ListWidgetProps {
  data: Array<Record<string, unknown>>;
  config: Record<string, unknown>;
}

export function ListWidget({ data, config }: ListWidgetProps) {
  const { dataSource, columns } = config;

  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-sm text-zinc-500">
        No items to display
      </div>
    );
  }

  // Render list based on data source
  switch (dataSource) {
    case "deals":
      return <DealsList data={data} />;
    case "contacts":
      return <ContactsList data={data} />;
    case "companies":
      return <CompaniesList data={data} />;
    case "activities":
      return <ActivitiesList data={data} />;
    default:
      return <GenericList data={data} columns={columns as string[] | undefined} />;
  }
}

function DealsList({ data }: { data: Array<Record<string, unknown>> }) {
  return (
    <div className="space-y-3">
      {data.map((deal) => (
        <Link
          key={deal._id as string}
          href={`/deals/${deal._id}`}
          className="flex items-center justify-between p-2 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
        >
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100 truncate">
              {deal.name as string}
            </p>
            <p className="text-xs text-zinc-500">
              {deal.status as string}
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
              {formatCurrency(deal.amount as number)}
            </p>
          </div>
        </Link>
      ))}
    </div>
  );
}

function ContactsList({ data }: { data: Array<Record<string, unknown>> }) {
  return (
    <div className="space-y-3">
      {data.map((contact) => (
        <Link
          key={contact._id as string}
          href={`/contacts/${contact._id}`}
          className="flex items-center gap-3 p-2 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
        >
          <Avatar className="h-8 w-8">
            <AvatarImage src={contact.avatarUrl as string} />
            <AvatarFallback>
              {((contact.firstName as string)?.[0] || "") +
                ((contact.lastName as string)?.[0] || "")}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100 truncate">
              {`${contact.firstName || ""} ${contact.lastName || ""}`.trim()}
            </p>
            <p className="text-xs text-zinc-500 truncate">
              {contact.email as string}
            </p>
          </div>
        </Link>
      ))}
    </div>
  );
}

function CompaniesList({ data }: { data: Array<Record<string, unknown>> }) {
  return (
    <div className="space-y-3">
      {data.map((company) => (
        <Link
          key={company._id as string}
          href={`/companies/${company._id}`}
          className="flex items-center gap-3 p-2 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
        >
          <Avatar className="h-8 w-8">
            <AvatarImage src={company.logoUrl as string} />
            <AvatarFallback>
              {(company.name as string)?.[0] || "?"}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100 truncate">
              {company.name as string}
            </p>
            <p className="text-xs text-zinc-500 truncate">
              {company.industry as string}
            </p>
          </div>
        </Link>
      ))}
    </div>
  );
}

function ActivitiesList({ data }: { data: Array<Record<string, unknown>> }) {
  const getTypeColor = (type: string) => {
    switch (type) {
      case "task":
        return "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300";
      case "call":
        return "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300";
      case "email":
        return "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300";
      case "meeting":
        return "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300";
      case "note":
        return "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300";
      default:
        return "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300";
    }
  };

  return (
    <div className="space-y-3">
      {data.map((activity) => (
        <div
          key={activity._id as string}
          className="flex items-start gap-3 p-2 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
        >
          <Badge className={getTypeColor(activity.type as string)}>
            {activity.type as string}
          </Badge>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100 truncate">
              {activity.subject as string}
            </p>
            <p className="text-xs text-zinc-500">
              {activity.createdAt
                ? format(new Date(activity.createdAt as number), "MMM d, yyyy")
                : ""}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

function GenericList({
  data,
  columns,
}: {
  data: Array<Record<string, unknown>>;
  columns?: string[];
}) {
  const displayColumns = columns || Object.keys(data[0] || {}).filter((k) => !k.startsWith("_"));

  return (
    <div className="space-y-2">
      {data.map((item, index) => (
        <div
          key={(item._id as string) || index}
          className="p-2 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
        >
          {displayColumns.slice(0, 3).map((col) => (
            <p key={col} className="text-sm text-zinc-700 dark:text-zinc-300 truncate">
              <span className="text-zinc-500">{col}: </span>
              {String(item[col] ?? "-")}
            </p>
          ))}
        </div>
      ))}
    </div>
  );
}
