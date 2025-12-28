"use client";

import {
  useState,
  useRef,
  useEffect,
  KeyboardEvent,
  ChangeEvent,
  forwardRef,
  useImperativeHandle,
} from "react";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn, getInitials } from "@/lib/utils";

interface UserSuggestion {
  _id: Id<"users">;
  firstName?: string;
  lastName?: string;
  email: string;
  avatarUrl?: string;
}

export interface MentionInputRef {
  focus: () => void;
  clear: () => void;
  getValue: () => string;
  getMentions: () => Id<"users">[];
}

interface MentionInputProps {
  value: string;
  onChange: (value: string, mentions: Id<"users">[]) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  minRows?: number;
  maxRows?: number;
  onSubmit?: () => void;
}

export const MentionInput = forwardRef<MentionInputRef, MentionInputProps>(
  (
    {
      value,
      onChange,
      placeholder = "Write a comment... Use @ to mention someone",
      disabled = false,
      className,
      minRows = 2,
      maxRows = 8,
      onSubmit,
    },
    ref
  ) => {
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const [showSuggestions, setShowSuggestions] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [mentionStart, setMentionStart] = useState<number | null>(null);
    const [mentions, setMentions] = useState<Id<"users">[]>([]);

    // Query for user suggestions
    const suggestions = useQuery(
      api.comments.searchUsersForMention,
      showSuggestions && searchQuery.length > 0
        ? { query: searchQuery, limit: 5 }
        : "skip"
    );

    // Expose methods via ref
    useImperativeHandle(ref, () => ({
      focus: () => textareaRef.current?.focus(),
      clear: () => {
        onChange("", []);
        setMentions([]);
      },
      getValue: () => value,
      getMentions: () => mentions,
    }));

    // Adjust textarea height
    useEffect(() => {
      const textarea = textareaRef.current;
      if (!textarea) return;

      textarea.style.height = "auto";
      const lineHeight = 24; // Approximate line height in pixels
      const minHeight = lineHeight * minRows;
      const maxHeight = lineHeight * maxRows;
      const scrollHeight = textarea.scrollHeight;

      textarea.style.height = `${Math.min(Math.max(scrollHeight, minHeight), maxHeight)}px`;
    }, [value, minRows, maxRows]);

    // Close dropdown when clicking outside
    useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (
          dropdownRef.current &&
          !dropdownRef.current.contains(event.target as Node) &&
          textareaRef.current &&
          !textareaRef.current.contains(event.target as Node)
        ) {
          setShowSuggestions(false);
        }
      };

      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
      const newValue = e.target.value;
      const cursorPos = e.target.selectionStart;

      // Check if we're in a mention context
      const textBeforeCursor = newValue.slice(0, cursorPos);
      const lastAtIndex = textBeforeCursor.lastIndexOf("@");

      if (lastAtIndex !== -1) {
        // Check if there's a space between @ and cursor
        const textAfterAt = textBeforeCursor.slice(lastAtIndex + 1);

        // If the text after @ doesn't contain newlines or multiple spaces, show suggestions
        if (!textAfterAt.includes("\n") && !/\s{2,}/.test(textAfterAt)) {
          setMentionStart(lastAtIndex);
          setSearchQuery(textAfterAt);
          setShowSuggestions(true);
          setSelectedIndex(0);
        } else {
          setShowSuggestions(false);
          setMentionStart(null);
        }
      } else {
        setShowSuggestions(false);
        setMentionStart(null);
      }

      onChange(newValue, mentions);
    };

    const insertMention = (user: UserSuggestion) => {
      if (mentionStart === null) return;

      const fullName = [user.firstName, user.lastName].filter(Boolean).join(" ");
      const displayName = fullName || user.email;
      const mentionText = fullName.includes(" ")
        ? `@[${displayName}]`
        : `@${displayName}`;

      const cursorPos = textareaRef.current?.selectionStart ?? value.length;
      const beforeMention = value.slice(0, mentionStart);
      const afterCursor = value.slice(cursorPos);

      const newValue = beforeMention + mentionText + " " + afterCursor;
      const newMentions = [...mentions, user._id];

      setMentions(newMentions);
      onChange(newValue, newMentions);
      setShowSuggestions(false);
      setMentionStart(null);

      // Focus and set cursor position after the mention
      setTimeout(() => {
        const newCursorPos = beforeMention.length + mentionText.length + 1;
        textareaRef.current?.focus();
        textareaRef.current?.setSelectionRange(newCursorPos, newCursorPos);
      }, 0);
    };

    const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
      if (showSuggestions && suggestions && suggestions.length > 0) {
        switch (e.key) {
          case "ArrowDown":
            e.preventDefault();
            setSelectedIndex((prev) =>
              prev < suggestions.length - 1 ? prev + 1 : 0
            );
            break;
          case "ArrowUp":
            e.preventDefault();
            setSelectedIndex((prev) =>
              prev > 0 ? prev - 1 : suggestions.length - 1
            );
            break;
          case "Enter":
            e.preventDefault();
            insertMention(suggestions[selectedIndex]);
            break;
          case "Escape":
            e.preventDefault();
            setShowSuggestions(false);
            break;
          case "Tab":
            e.preventDefault();
            insertMention(suggestions[selectedIndex]);
            break;
        }
      } else if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        onSubmit?.();
      }
    };

    return (
      <div className="relative">
        <Textarea
          ref={textareaRef}
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          className={cn(
            "resize-none overflow-hidden",
            className
          )}
          rows={minRows}
        />

        {/* Suggestions Dropdown */}
        {showSuggestions && suggestions && suggestions.length > 0 && (
          <div
            ref={dropdownRef}
            className="absolute left-0 top-full z-50 mt-1 w-full max-w-xs rounded-lg border border-zinc-200 bg-white shadow-lg dark:border-zinc-700 dark:bg-zinc-800"
          >
            {suggestions.map((user, index) => {
              const fullName = [user.firstName, user.lastName]
                .filter(Boolean)
                .join(" ");

              return (
                <button
                  key={user._id}
                  type="button"
                  onClick={() => insertMention(user)}
                  className={cn(
                    "flex w-full items-center gap-3 px-3 py-2 text-left transition-colors",
                    index === selectedIndex
                      ? "bg-zinc-100 dark:bg-zinc-700"
                      : "hover:bg-zinc-50 dark:hover:bg-zinc-700/50",
                    index === 0 && "rounded-t-lg",
                    index === suggestions.length - 1 && "rounded-b-lg"
                  )}
                >
                  <Avatar className="h-7 w-7">
                    <AvatarImage src={user.avatarUrl} />
                    <AvatarFallback className="text-xs">
                      {getInitials(user.firstName, user.lastName)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-100">
                      {fullName || "Unnamed User"}
                    </p>
                    <p className="truncate text-xs text-zinc-500">
                      {user.email}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {/* Hint text */}
        {!showSuggestions && value.length === 0 && (
          <p className="mt-1 text-xs text-zinc-400">
            Press Cmd/Ctrl + Enter to submit
          </p>
        )}
      </div>
    );
  }
);

MentionInput.displayName = "MentionInput";
