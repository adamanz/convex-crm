"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Send, Loader2 } from "lucide-react";

interface SMSCampaignFormProps {
  selectedContactIds: Id<"contacts">[];
  onSuccess?: () => void;
}

export function SMSCampaignForm({
  selectedContactIds,
  onSuccess,
}: SMSCampaignFormProps) {
  const [campaignName, setCampaignName] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const sendBulkSMS = useMutation(api.sendblue.sendBulkSMS);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!campaignName.trim()) {
      toast.error("Campaign name is required");
      return;
    }

    if (!message.trim()) {
      toast.error("Message cannot be empty");
      return;
    }

    if (selectedContactIds.length === 0) {
      toast.error("Select at least one contact");
      return;
    }

    setIsLoading(true);
    try {
      await sendBulkSMS({
        contactIds: selectedContactIds,
        message: message.trim(),
      });
      toast.success(`Campaign sent to ${selectedContactIds.length} contacts`);
      setCampaignName("");
      setMessage("");
      onSuccess?.();
    } catch (error) {
      toast.error(`Failed to send campaign: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="campaign-name">Campaign Name</Label>
        <Input
          id="campaign-name"
          placeholder="e.g., Summer Promotion"
          value={campaignName}
          onChange={(e) => setCampaignName(e.target.value)}
          disabled={isLoading}
        />
      </div>

      <div>
        <Label htmlFor="message">Message</Label>
        <Textarea
          id="message"
          placeholder="Type your message..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={4}
          disabled={isLoading}
        />
        <div className="mt-1 text-sm text-zinc-400">
          {message.length} / 160 characters | {selectedContactIds.length} contacts
        </div>
      </div>

      <Button
        type="submit"
        disabled={isLoading || selectedContactIds.length === 0 || !message.trim()}
      >
        {isLoading ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Sending...
          </>
        ) : (
          <>
            <Send className="h-4 w-4 mr-2" />
            Send Campaign
          </>
        )}
      </Button>
    </form>
  );
}
