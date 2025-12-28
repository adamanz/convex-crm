"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { MessageSquare } from "lucide-react";

interface SendSMSDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contactId: Id<"contacts">;
  contactName: string;
  contactPhone?: string;
}

export function SendSMSDialog({
  open,
  onOpenChange,
  contactId,
  contactName,
  contactPhone,
}: SendSMSDialogProps) {
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const sendSMS = useMutation(api.sendblue.sendSMS);

  const handleSend = async () => {
    if (!message.trim()) {
      toast.error("Message cannot be empty");
      return;
    }

    if (!contactPhone) {
      toast.error("Contact has no phone number");
      return;
    }

    setIsLoading(true);
    try {
      await sendSMS({
        contactId,
        message: message.trim(),
      });
      toast.success("SMS sent successfully");
      setMessage("");
      onOpenChange(false);
    } catch (error) {
      toast.error(`Failed to send SMS: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            Send SMS to {contactName}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {contactPhone && (
            <div className="text-sm text-zinc-500">
              Phone: {contactPhone}
            </div>
          )}

          <Textarea
            placeholder="Type your message here..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={4}
            disabled={isLoading}
          />

          <div className="text-sm text-zinc-400">
            {message.length} / 160 characters
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button onClick={handleSend} disabled={isLoading || !message.trim()}>
            {isLoading ? "Sending..." : "Send SMS"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
