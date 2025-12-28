"use client";

import * as React from "react";
import { Send, Paperclip, X, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

export interface EmailRecipient {
  email: string;
  name?: string;
}

export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
}

export interface EmailComposerProps {
  /** Initial recipients for To field */
  initialTo?: EmailRecipient[];
  /** Initial subject line */
  initialSubject?: string;
  /** Initial body content */
  initialBody?: string;
  /** Available contacts for autocomplete */
  contacts?: EmailRecipient[];
  /** Available email templates */
  templates?: EmailTemplate[];
  /** Callback when email is sent */
  onSend?: (email: {
    to: EmailRecipient[];
    cc: EmailRecipient[];
    bcc: EmailRecipient[];
    subject: string;
    body: string;
    templateId?: string;
  }) => void;
  /** Callback when composer is closed/cancelled */
  onCancel?: () => void;
  /** Whether the composer is in a loading/sending state */
  isSending?: boolean;
  /** Additional class name */
  className?: string;
}

export function EmailComposer({
  initialTo = [],
  initialSubject = "",
  initialBody = "",
  contacts = [],
  templates = [],
  onSend,
  onCancel,
  isSending = false,
  className,
}: EmailComposerProps) {
  const [to, setTo] = React.useState<EmailRecipient[]>(initialTo);
  const [cc, setCc] = React.useState<EmailRecipient[]>([]);
  const [bcc, setBcc] = React.useState<EmailRecipient[]>([]);
  const [subject, setSubject] = React.useState(initialSubject);
  const [body, setBody] = React.useState(initialBody);
  const [selectedTemplateId, setSelectedTemplateId] = React.useState<string>();
  const [showCcBcc, setShowCcBcc] = React.useState(false);

  const [toInput, setToInput] = React.useState("");
  const [ccInput, setCcInput] = React.useState("");
  const [bccInput, setBccInput] = React.useState("");

  const handleApplyTemplate = (template: EmailTemplate) => {
    setSubject(template.subject);
    setBody(template.body);
    setSelectedTemplateId(template.id);
  };

  const handleSend = () => {
    if (to.length === 0 || !subject.trim()) return;
    onSend?.({
      to,
      cc,
      bcc,
      subject,
      body,
      templateId: selectedTemplateId,
    });
  };

  const addRecipient = (
    email: string,
    list: EmailRecipient[],
    setList: React.Dispatch<React.SetStateAction<EmailRecipient[]>>,
    setInput: React.Dispatch<React.SetStateAction<string>>
  ) => {
    const trimmedEmail = email.trim();
    if (trimmedEmail && !list.some((r) => r.email === trimmedEmail)) {
      const contact = contacts.find((c) => c.email === trimmedEmail);
      setList([...list, { email: trimmedEmail, name: contact?.name }]);
      setInput("");
    }
  };

  const removeRecipient = (
    email: string,
    list: EmailRecipient[],
    setList: React.Dispatch<React.SetStateAction<EmailRecipient[]>>
  ) => {
    setList(list.filter((r) => r.email !== email));
  };

  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    input: string,
    list: EmailRecipient[],
    setList: React.Dispatch<React.SetStateAction<EmailRecipient[]>>,
    setInput: React.Dispatch<React.SetStateAction<string>>
  ) => {
    if (e.key === "Enter" || e.key === "," || e.key === "Tab") {
      e.preventDefault();
      addRecipient(input, list, setList, setInput);
    }
  };

  const filteredContacts = (input: string, excludeList: EmailRecipient[]) => {
    if (!input.trim()) return [];
    const lowerInput = input.toLowerCase();
    return contacts
      .filter(
        (c) =>
          !excludeList.some((r) => r.email === c.email) &&
          (c.email.toLowerCase().includes(lowerInput) ||
            c.name?.toLowerCase().includes(lowerInput))
      )
      .slice(0, 5);
  };

  const RecipientField = ({
    label,
    recipients,
    setRecipients,
    input,
    setInput,
  }: {
    label: string;
    recipients: EmailRecipient[];
    setRecipients: React.Dispatch<React.SetStateAction<EmailRecipient[]>>;
    input: string;
    setInput: React.Dispatch<React.SetStateAction<string>>;
  }) => {
    const suggestions = filteredContacts(input, recipients);
    const [showSuggestions, setShowSuggestions] = React.useState(false);

    return (
      <div className="space-y-1.5">
        <Label className="text-xs text-muted-foreground">{label}</Label>
        <div className="flex flex-wrap items-center gap-1.5 min-h-9 p-1.5 rounded-md border border-input bg-transparent">
          {recipients.map((recipient) => (
            <Badge
              key={recipient.email}
              variant="secondary"
              className="gap-1 pr-1"
            >
              {recipient.name || recipient.email}
              <button
                type="button"
                onClick={() =>
                  removeRecipient(recipient.email, recipients, setRecipients)
                }
                className="rounded-full hover:bg-muted-foreground/20"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
          <div className="relative flex-1 min-w-[120px]">
            <input
              type="email"
              value={input}
              onChange={(e) => {
                setInput(e.target.value);
                setShowSuggestions(true);
              }}
              onFocus={() => setShowSuggestions(true)}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
              onKeyDown={(e) =>
                handleKeyDown(e, input, recipients, setRecipients, setInput)
              }
              placeholder="Add email..."
              className="w-full bg-transparent outline-none text-sm placeholder:text-muted-foreground"
            />
            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 z-10 bg-popover border rounded-md shadow-md">
                {suggestions.map((contact) => (
                  <button
                    key={contact.email}
                    type="button"
                    className="w-full px-3 py-2 text-left text-sm hover:bg-accent flex flex-col"
                    onMouseDown={() => {
                      addRecipient(
                        contact.email,
                        recipients,
                        setRecipients,
                        setInput
                      );
                    }}
                  >
                    {contact.name && (
                      <span className="font-medium">{contact.name}</span>
                    )}
                    <span className="text-muted-foreground">
                      {contact.email}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className={cn("flex flex-col gap-4", className)}>
      {/* Recipients */}
      <div className="space-y-3">
        <RecipientField
          label="To"
          recipients={to}
          setRecipients={setTo}
          input={toInput}
          setInput={setToInput}
        />

        {/* CC/BCC Toggle */}
        <button
          type="button"
          onClick={() => setShowCcBcc(!showCcBcc)}
          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          {showCcBcc ? (
            <ChevronUp className="h-3 w-3" />
          ) : (
            <ChevronDown className="h-3 w-3" />
          )}
          {showCcBcc ? "Hide" : "Show"} CC/BCC
        </button>

        {showCcBcc && (
          <>
            <RecipientField
              label="CC"
              recipients={cc}
              setRecipients={setCc}
              input={ccInput}
              setInput={setCcInput}
            />
            <RecipientField
              label="BCC"
              recipients={bcc}
              setRecipients={setBcc}
              input={bccInput}
              setInput={setBccInput}
            />
          </>
        )}
      </div>

      {/* Template Selection */}
      {templates.length > 0 && (
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Template</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-between font-normal"
              >
                {selectedTemplateId
                  ? templates.find((t) => t.id === selectedTemplateId)?.name
                  : "Select a template..."}
                <ChevronDown className="h-4 w-4 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[300px] p-0" align="start">
              <div className="max-h-[200px] overflow-auto">
                {templates.map((template) => (
                  <button
                    key={template.id}
                    type="button"
                    onClick={() => handleApplyTemplate(template)}
                    className={cn(
                      "w-full px-3 py-2 text-left text-sm hover:bg-accent",
                      selectedTemplateId === template.id && "bg-accent"
                    )}
                  >
                    {template.name}
                  </button>
                ))}
              </div>
            </PopoverContent>
          </Popover>
        </div>
      )}

      {/* Subject */}
      <div className="space-y-1.5">
        <Label className="text-xs text-muted-foreground">Subject</Label>
        <Input
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          placeholder="Email subject..."
        />
      </div>

      {/* Body */}
      <div className="space-y-1.5 flex-1">
        <Label className="text-xs text-muted-foreground">Message</Label>
        <Textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Write your message..."
          className="min-h-[200px] resize-none"
        />
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between pt-2 border-t">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" type="button" disabled>
            <Paperclip className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex items-center gap-2">
          {onCancel && (
            <Button variant="ghost" onClick={onCancel} disabled={isSending}>
              Cancel
            </Button>
          )}
          <Button
            onClick={handleSend}
            disabled={isSending || to.length === 0 || !subject.trim()}
          >
            {isSending ? (
              "Sending..."
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Send
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default EmailComposer;
