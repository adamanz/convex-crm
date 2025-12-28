"use client";

import * as React from "react";
import { Mail, Send, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { EmailComposer, type EmailRecipient, type EmailTemplate } from "./EmailComposer";
import { cn } from "@/lib/utils";

export interface QuickEmailProps {
  /** Recipient for the quick email */
  recipient?: EmailRecipient;
  /** Available templates for quick send */
  templates?: EmailTemplate[];
  /** Available contacts for composer autocomplete */
  contacts?: EmailRecipient[];
  /** Callback when email is sent */
  onSend?: (email: {
    to: EmailRecipient[];
    cc: EmailRecipient[];
    bcc: EmailRecipient[];
    subject: string;
    body: string;
    templateId?: string;
  }) => void;
  /** Button variant */
  variant?: "default" | "outline" | "ghost" | "secondary";
  /** Button size */
  size?: "default" | "sm" | "lg" | "icon";
  /** Whether to show text label */
  showLabel?: boolean;
  /** Custom label text */
  label?: string;
  /** Additional class name */
  className?: string;
}

export function QuickEmail({
  recipient,
  templates = [],
  contacts = [],
  onSend,
  variant = "outline",
  size = "default",
  showLabel = true,
  label = "Email",
  className,
}: QuickEmailProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [selectedTemplate, setSelectedTemplate] =
    React.useState<EmailTemplate>();
  const [isSending, setIsSending] = React.useState(false);

  const handleQuickTemplate = (template: EmailTemplate) => {
    setSelectedTemplate(template);
    setIsOpen(true);
  };

  const handleSend = async (email: {
    to: EmailRecipient[];
    cc: EmailRecipient[];
    bcc: EmailRecipient[];
    subject: string;
    body: string;
    templateId?: string;
  }) => {
    setIsSending(true);
    try {
      await onSend?.(email);
      setIsOpen(false);
      setSelectedTemplate(undefined);
    } finally {
      setIsSending(false);
    }
  };

  const handleCancel = () => {
    setIsOpen(false);
    setSelectedTemplate(undefined);
  };

  // If no templates, show a simple button that opens the composer
  if (templates.length === 0) {
    return (
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <Tooltip>
          <TooltipTrigger asChild>
            <DialogTrigger asChild>
              <Button variant={variant} size={size} className={className}>
                <Mail className="h-4 w-4" />
                {showLabel && size !== "icon" && (
                  <span className="ml-2">{label}</span>
                )}
              </Button>
            </DialogTrigger>
          </TooltipTrigger>
          <TooltipContent>Send email</TooltipContent>
        </Tooltip>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>New Email</DialogTitle>
          </DialogHeader>
          <EmailComposer
            initialTo={recipient ? [recipient] : []}
            contacts={contacts}
            templates={templates}
            onSend={handleSend}
            onCancel={handleCancel}
            isSending={isSending}
          />
        </DialogContent>
      </Dialog>
    );
  }

  // With templates, show a split button
  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <div className={cn("inline-flex rounded-md shadow-sm", className)}>
        <Tooltip>
          <TooltipTrigger asChild>
            <DialogTrigger asChild>
              <Button
                variant={variant}
                size={size}
                className="rounded-r-none border-r-0"
              >
                <Mail className="h-4 w-4" />
                {showLabel && size !== "icon" && (
                  <span className="ml-2">{label}</span>
                )}
              </Button>
            </DialogTrigger>
          </TooltipTrigger>
          <TooltipContent>Compose new email</TooltipContent>
        </Tooltip>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant={variant}
              size={size}
              className="rounded-l-none px-2"
            >
              <ChevronDown className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            {templates.map((template) => (
              <DropdownMenuItem
                key={template.id}
                onClick={() => handleQuickTemplate(template)}
              >
                <Send className="h-4 w-4 mr-2" />
                {template.name}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <DialogContent className="max-w-2xl max-h-[90vh] overflow-auto">
        <DialogHeader>
          <DialogTitle>
            {selectedTemplate ? `Email: ${selectedTemplate.name}` : "New Email"}
          </DialogTitle>
        </DialogHeader>
        <EmailComposer
          initialTo={recipient ? [recipient] : []}
          initialSubject={selectedTemplate?.subject}
          initialBody={selectedTemplate?.body}
          contacts={contacts}
          templates={templates}
          onSend={handleSend}
          onCancel={handleCancel}
          isSending={isSending}
        />
      </DialogContent>
    </Dialog>
  );
}

export default QuickEmail;
