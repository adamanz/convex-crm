"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  Users,
  Building2,
  DollarSign,
  CheckSquare,
  FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

interface CreateFABProps {
  className?: string;
}

export function CreateFAB({ className }: CreateFABProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);

  const createOptions = [
    {
      icon: Users,
      label: "Add Contact",
      href: "/contacts?new=true",
      color: "bg-blue-500 hover:bg-blue-600",
    },
    {
      icon: Building2,
      label: "Add Company",
      href: "/companies?new=true",
      color: "bg-purple-500 hover:bg-purple-600",
    },
    {
      icon: DollarSign,
      label: "Add Deal",
      href: "/deals?new=true",
      color: "bg-green-500 hover:bg-green-600",
    },
    {
      icon: CheckSquare,
      label: "Add Task",
      href: "/activities?new=true&type=task",
      color: "bg-orange-500 hover:bg-orange-600",
    },
  ];

  const handleCreate = (href: string) => {
    router.push(href);
    setIsOpen(false);
  };

  return (
    <div className={cn("fixed bottom-6 right-6 z-40", className)}>
      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenuTrigger asChild>
          <Button
            size="lg"
            className={cn(
              "h-14 w-14 rounded-full shadow-lg transition-all",
              "bg-blue-600 hover:bg-blue-700 text-white",
              "active:scale-95",
              isOpen && "scale-110"
            )}
          >
            <Plus className="h-6 w-6" />
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end" className="w-48">
          {createOptions.map((option) => {
            const Icon = option.icon;
            return (
              <DropdownMenuItem
                key={option.href}
                onClick={() => handleCreate(option.href)}
              >
                <Icon className="h-4 w-4 mr-2" />
                {option.label}
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
