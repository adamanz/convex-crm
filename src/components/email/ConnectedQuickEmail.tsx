"use client";

import * as React from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { QuickEmail } from "./QuickEmail";
import { toast } from "sonner";
import type { EmailRecipient, EmailTemplate } from "./EmailComposer";

export interface ConnectedQuickEmailProps {
  /** Recipient for the quick email */
  recipient?: EmailRecipient;
  /** Related entity type (for activity logging) */
  relatedToType?: "contact" | "company" | "deal";
  /** Related entity ID */
  relatedToId?: string;
  /** Current user ID for tracking who sent the email */
  userId?: Id<"users">;
  /** Button variant */
  variant?: "default" | "outline" | "ghost" | "secondary";
  /** Button size */
  size?: "default" | "sm" | "lg" | "icon";
  /** Whether to show text label */
  showLabel?: boolean;
  /** Custom label text */
  label?: string;
  /** Callback after email is sent successfully */
  onSuccess?: (emailId: Id<"emails">) => void;
  /** Additional class name */
  className?: string;
}

/**
 * Connected version of QuickEmail that integrates with Convex backend
 * Automatically fetches templates and contacts, and handles sending via mutation
 */
export function ConnectedQuickEmail({
  recipient,
  relatedToType,
  relatedToId,
  userId,
  variant = "outline",
  size = "default",
  showLabel = true,
  label = "Email",
  onSuccess,
  className,
}: ConnectedQuickEmailProps) {
  // Fetch email templates
  const templatesData = useQuery(api.email.listTemplates, {});

  // Fetch contacts for autocomplete (using pagination API)
  const contactsData = useQuery(api.contacts.list, {
    paginationOpts: { numItems: 100 },
  });

  // Send email mutation
  const sendEmail = useMutation(api.email.send);

  // Transform templates to the format expected by EmailComposer
  const templates: EmailTemplate[] = React.useMemo(() => {
    if (!templatesData) return [];
    return templatesData.map((t: { _id: string; name: string; subject: string; body: string }) => ({
      id: t._id,
      name: t.name,
      subject: t.subject,
      body: t.body,
    }));
  }, [templatesData]);

  // Transform contacts to the format expected by EmailComposer
  const contacts: EmailRecipient[] = React.useMemo(() => {
    if (!contactsData?.page) return [];
    return contactsData.page
      .filter((c: { email?: string }) => c.email)
      .map((c: { email?: string; firstName?: string; lastName?: string }) => ({
        email: c.email!,
        name: [c.firstName, c.lastName].filter(Boolean).join(" ") || undefined,
      }));
  }, [contactsData]);

  const handleSend = async (email: {
    to: EmailRecipient[];
    cc: EmailRecipient[];
    bcc: EmailRecipient[];
    subject: string;
    body: string;
    templateId?: string;
  }) => {
    try {
      const emailId = await sendEmail({
        to: email.to,
        cc: email.cc.length > 0 ? email.cc : undefined,
        bcc: email.bcc.length > 0 ? email.bcc : undefined,
        subject: email.subject,
        body: email.body,
        templateId: email.templateId as Id<"emailTemplates"> | undefined,
        relatedToType,
        relatedToId,
        sentBy: userId,
      });

      toast.success("Email sent successfully", {
        description: `Sent to ${email.to.map((r) => r.email).join(", ")}`,
      });

      onSuccess?.(emailId);
    } catch (error) {
      console.error("Failed to send email:", error);
      toast.error("Failed to send email", {
        description: error instanceof Error ? error.message : "An error occurred",
      });
      throw error; // Re-throw to keep the modal open
    }
  };

  return (
    <QuickEmail
      recipient={recipient}
      templates={templates}
      contacts={contacts}
      onSend={handleSend}
      variant={variant}
      size={size}
      showLabel={showLabel}
      label={label}
      className={className}
    />
  );
}

export default ConnectedQuickEmail;
