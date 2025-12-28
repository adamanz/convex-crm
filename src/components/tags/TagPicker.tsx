"use client";

import * as React from "react";
import { Check, Plus, X, Loader2 } from "lucide-react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { cn } from "@/lib/utils";
import { TagBadge } from "./TagBadge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { Button } from "@/components/ui/button";

export interface TagPickerProps {
  value: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
  maxTags?: number;
  disabled?: boolean;
  allowCreate?: boolean;
  className?: string;
}

export function TagPicker({
  value,
  onChange,
  placeholder = "Select tags...",
  maxTags,
  disabled = false,
  allowCreate = true,
  className,
}: TagPickerProps) {
  const [open, setOpen] = React.useState(false);
  const [searchTerm, setSearchTerm] = React.useState("");
  const [isCreating, setIsCreating] = React.useState(false);

  // Fetch all tags
  const allTags = useQuery(api.tags.list, { sortBy: "usage" });

  // Fetch tag details for selected tags (to get colors)
  const selectedTagDetails = useQuery(api.tags.getByNames, { names: value });

  // Mutations
  const createTag = useMutation(api.tags.getOrCreate);
  const incrementUsage = useMutation(api.tags.incrementUsage);
  const decrementUsage = useMutation(api.tags.decrementUsage);

  // Filter tags based on search
  const filteredTags = React.useMemo(() => {
    if (!allTags) return [];

    const searchLower = searchTerm.toLowerCase().trim();
    if (!searchLower) return allTags;

    return allTags.filter((tag) =>
      tag.name.toLowerCase().includes(searchLower)
    );
  }, [allTags, searchTerm]);

  // Check if current search matches an existing tag
  const exactMatch = React.useMemo(() => {
    if (!allTags) return false;
    const searchLower = searchTerm.toLowerCase().trim();
    return allTags.some((tag) => tag.name.toLowerCase() === searchLower);
  }, [allTags, searchTerm]);

  const canAddMore = !maxTags || value.length < maxTags;
  const showCreateOption =
    allowCreate &&
    canAddMore &&
    searchTerm.trim() &&
    !exactMatch &&
    !value.includes(searchTerm.trim());

  const handleSelect = async (tagName: string) => {
    if (value.includes(tagName)) {
      // Remove tag
      onChange(value.filter((t) => t !== tagName));
      await decrementUsage({ tagName });
    } else if (canAddMore) {
      // Add tag
      onChange([...value, tagName]);
      await incrementUsage({ tagName });
    }
  };

  const handleCreate = async () => {
    const newTagName = searchTerm.trim();
    if (!newTagName || !canAddMore) return;

    setIsCreating(true);
    try {
      await createTag({ name: newTagName });
      onChange([...value, newTagName]);
      await incrementUsage({ tagName: newTagName });
      setSearchTerm("");
    } catch (error) {
      console.error("Failed to create tag:", error);
    } finally {
      setIsCreating(false);
    }
  };

  const handleRemove = async (tagName: string) => {
    onChange(value.filter((t) => t !== tagName));
    await decrementUsage({ tagName });
  };

  // Get tag color by name
  const getTagColor = (tagName: string): string | undefined => {
    const tagDetail = selectedTagDetails?.find(
      (t) => t.name.toLowerCase() === tagName.toLowerCase()
    );
    return tagDetail?.color;
  };

  return (
    <div className={cn("space-y-2", className)}>
      {/* Selected tags display */}
      {value.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {value.map((tagName) => (
            <TagBadge
              key={tagName}
              name={tagName}
              color={getTagColor(tagName)}
              size="md"
              removable={!disabled}
              onRemove={() => handleRemove(tagName)}
            />
          ))}
        </div>
      )}

      {/* Tag picker popover */}
      {!disabled && canAddMore && (
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="h-8 border-dashed"
              disabled={disabled}
            >
              <Plus className="mr-1 h-3.5 w-3.5" />
              {placeholder}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[240px] p-0" align="start">
            <Command shouldFilter={false}>
              <CommandInput
                placeholder="Search tags..."
                value={searchTerm}
                onValueChange={setSearchTerm}
              />
              <CommandList>
                {!allTags ? (
                  <div className="flex items-center justify-center py-6">
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  <>
                    {filteredTags.length === 0 && !showCreateOption && (
                      <CommandEmpty>No tags found.</CommandEmpty>
                    )}

                    {filteredTags.length > 0 && (
                      <CommandGroup heading="Tags">
                        {filteredTags.map((tag) => {
                          const isSelected = value.includes(tag.name);
                          return (
                            <CommandItem
                              key={tag._id}
                              value={tag.name}
                              onSelect={() => handleSelect(tag.name)}
                            >
                              <div
                                className={cn(
                                  "mr-2 flex h-4 w-4 items-center justify-center rounded-sm border",
                                  isSelected
                                    ? "border-primary bg-primary text-primary-foreground"
                                    : "border-muted opacity-50"
                                )}
                              >
                                {isSelected && <Check className="h-3 w-3" />}
                              </div>
                              <div className="flex items-center gap-2">
                                <span
                                  className="h-3 w-3 rounded-full"
                                  style={{ backgroundColor: tag.color }}
                                />
                                <span>{tag.name}</span>
                                <span className="ml-auto text-xs text-muted-foreground">
                                  {tag.usageCount}
                                </span>
                              </div>
                            </CommandItem>
                          );
                        })}
                      </CommandGroup>
                    )}

                    {showCreateOption && (
                      <>
                        {filteredTags.length > 0 && <CommandSeparator />}
                        <CommandGroup>
                          <CommandItem
                            onSelect={handleCreate}
                            disabled={isCreating}
                          >
                            {isCreating ? (
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                              <Plus className="mr-2 h-4 w-4" />
                            )}
                            Create &quot;{searchTerm.trim()}&quot;
                          </CommandItem>
                        </CommandGroup>
                      </>
                    )}
                  </>
                )}
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      )}

      {/* Max tags indicator */}
      {maxTags && (
        <p className="text-xs text-muted-foreground">
          {value.length}/{maxTags} tags
        </p>
      )}
    </div>
  );
}

/**
 * Inline tag picker that shows as an input field
 */
export interface InlineTagPickerProps extends TagPickerProps {
  label?: string;
}

export function InlineTagPicker({
  value,
  onChange,
  placeholder = "Add tags...",
  maxTags,
  disabled = false,
  allowCreate = true,
  label,
  className,
}: InlineTagPickerProps) {
  const [inputValue, setInputValue] = React.useState("");
  const [showSuggestions, setShowSuggestions] = React.useState(false);
  const [highlightedIndex, setHighlightedIndex] = React.useState(-1);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const containerRef = React.useRef<HTMLDivElement>(null);

  // Fetch tags
  const searchResults = useQuery(
    api.tags.search,
    inputValue.trim() ? { searchTerm: inputValue, limit: 8 } : { searchTerm: "", limit: 8 }
  );
  const createTag = useMutation(api.tags.getOrCreate);
  const incrementUsage = useMutation(api.tags.incrementUsage);
  const decrementUsage = useMutation(api.tags.decrementUsage);

  // Filter out already selected tags
  const suggestions = React.useMemo(() => {
    if (!searchResults) return [];
    return searchResults.filter((tag) => !value.includes(tag.name));
  }, [searchResults, value]);

  // Check if input matches existing tag
  const exactMatch = suggestions.some(
    (tag) => tag.name.toLowerCase() === inputValue.toLowerCase().trim()
  );

  const canAddMore = !maxTags || value.length < maxTags;
  const showCreateOption =
    allowCreate && canAddMore && inputValue.trim() && !exactMatch;

  const addTag = async (tagName: string) => {
    if (!tagName.trim() || !canAddMore || value.includes(tagName)) return;

    try {
      await createTag({ name: tagName });
      onChange([...value, tagName]);
      await incrementUsage({ tagName });
    } catch (error) {
      console.error("Failed to add tag:", error);
    }

    setInputValue("");
    setHighlightedIndex(-1);
    inputRef.current?.focus();
  };

  const removeTag = async (tagName: string) => {
    onChange(value.filter((t) => t !== tagName));
    await decrementUsage({ tagName });
    inputRef.current?.focus();
  };

  const handleKeyDown = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (highlightedIndex >= 0 && suggestions[highlightedIndex]) {
        await addTag(suggestions[highlightedIndex].name);
      } else if (inputValue.trim() && allowCreate) {
        await addTag(inputValue.trim());
      }
    } else if (e.key === "Backspace" && !inputValue && value.length > 0) {
      await removeTag(value[value.length - 1]);
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      const maxIndex = showCreateOption ? suggestions.length : suggestions.length - 1;
      setHighlightedIndex((prev) => (prev < maxIndex ? prev + 1 : prev));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : -1));
    } else if (e.key === "Escape") {
      setShowSuggestions(false);
      setHighlightedIndex(-1);
    }
  };

  // Close suggestions when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      {label && (
        <label className="mb-1.5 block text-sm font-medium">{label}</label>
      )}
      <div
        className={cn(
          "flex min-h-9 flex-wrap items-center gap-1.5 rounded-md border border-input bg-transparent px-3 py-1.5 shadow-sm transition-colors",
          "focus-within:ring-1 focus-within:ring-ring",
          disabled && "cursor-not-allowed opacity-50"
        )}
        onClick={() => inputRef.current?.focus()}
      >
        {value.map((tagName) => {
          const tagInfo = searchResults?.find(
            (t) => t.name.toLowerCase() === tagName.toLowerCase()
          );
          return (
            <TagBadge
              key={tagName}
              name={tagName}
              color={tagInfo?.color}
              size="sm"
              removable={!disabled}
              onRemove={() => removeTag(tagName)}
            />
          );
        })}
        {canAddMore && (
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => {
              setInputValue(e.target.value);
              setHighlightedIndex(-1);
              if (e.target.value) {
                setShowSuggestions(true);
              }
            }}
            onKeyDown={handleKeyDown}
            onFocus={() => setShowSuggestions(true)}
            placeholder={value.length === 0 ? placeholder : ""}
            disabled={disabled}
            className={cn(
              "flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground",
              "min-w-[80px]"
            )}
          />
        )}
      </div>

      {/* Suggestions dropdown */}
      {showSuggestions && (suggestions.length > 0 || showCreateOption) && (
        <div className="absolute left-0 right-0 z-50 mt-1 max-h-48 overflow-auto rounded-md border border-border bg-popover shadow-lg">
          {suggestions.map((tag, index) => (
            <button
              key={tag._id}
              type="button"
              onClick={() => addTag(tag.name)}
              className={cn(
                "flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition-colors",
                "hover:bg-accent",
                index === highlightedIndex && "bg-accent"
              )}
            >
              <span
                className="h-3 w-3 rounded-full"
                style={{ backgroundColor: tag.color }}
              />
              <span>{tag.name}</span>
              <span className="ml-auto text-xs text-muted-foreground">
                {tag.usageCount}
              </span>
            </button>
          ))}
          {showCreateOption && (
            <button
              type="button"
              onClick={() => addTag(inputValue.trim())}
              className={cn(
                "flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition-colors",
                "hover:bg-accent border-t",
                highlightedIndex === suggestions.length && "bg-accent"
              )}
            >
              <Plus className="h-3 w-3" />
              <span>Create &quot;{inputValue.trim()}&quot;</span>
            </button>
          )}
        </div>
      )}

      {/* Max tags indicator */}
      {maxTags && (
        <p className="mt-1 text-xs text-muted-foreground">
          {value.length}/{maxTags} tags
        </p>
      )}
    </div>
  );
}

export default TagPicker;
