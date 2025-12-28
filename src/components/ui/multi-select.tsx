"use client";

import * as React from "react";
import { Check, ChevronsUpDown, Loader2, Search, X } from "lucide-react";
import { Command as CommandPrimitive } from "cmdk";

import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

/* -----------------------------------------------------------------------------
 * Command Components (for internal use)
 * -------------------------------------------------------------------------- */

const Command = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive>
>(({ className, ...props }, ref) => (
  <CommandPrimitive
    ref={ref}
    className={cn(
      "flex h-full w-full flex-col overflow-hidden rounded-md bg-popover text-popover-foreground",
      className
    )}
    {...props}
  />
));
Command.displayName = CommandPrimitive.displayName;

const CommandInput = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive.Input>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.Input>
>(({ className, ...props }, ref) => (
  <div className="flex items-center border-b px-3" cmdk-input-wrapper="">
    <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
    <CommandPrimitive.Input
      ref={ref}
      className={cn(
        "flex h-10 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    />
  </div>
));
CommandInput.displayName = CommandPrimitive.Input.displayName;

const CommandList = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.List>
>(({ className, ...props }, ref) => (
  <CommandPrimitive.List
    ref={ref}
    className={cn("max-h-[300px] overflow-y-auto overflow-x-hidden", className)}
    {...props}
  />
));
CommandList.displayName = CommandPrimitive.List.displayName;

const CommandEmpty = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive.Empty>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.Empty>
>((props, ref) => (
  <CommandPrimitive.Empty
    ref={ref}
    className="py-6 text-center text-sm"
    {...props}
  />
));
CommandEmpty.displayName = CommandPrimitive.Empty.displayName;

const CommandGroup = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive.Group>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.Group>
>(({ className, ...props }, ref) => (
  <CommandPrimitive.Group
    ref={ref}
    className={cn(
      "overflow-hidden p-1 text-foreground [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-muted-foreground",
      className
    )}
    {...props}
  />
));
CommandGroup.displayName = CommandPrimitive.Group.displayName;

const CommandItem = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.Item>
>(({ className, ...props }, ref) => (
  <CommandPrimitive.Item
    ref={ref}
    className={cn(
      "relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none data-[disabled=true]:pointer-events-none data-[selected=true]:bg-accent data-[selected=true]:text-accent-foreground data-[disabled=true]:opacity-50",
      className
    )}
    {...props}
  />
));
CommandItem.displayName = CommandPrimitive.Item.displayName;

/* -----------------------------------------------------------------------------
 * MultiSelect Types
 * -------------------------------------------------------------------------- */

export interface MultiSelectOption {
  /** Unique value for the option */
  value: string;
  /** Display label for the option */
  label: string;
  /** Optional description shown below the label */
  description?: string;
  /** Optional icon to display */
  icon?: React.ReactNode;
  /** Whether the option is disabled */
  disabled?: boolean;
  /** Optional group name for grouping options */
  group?: string;
  /** Optional color for badge display */
  color?: string;
}

export interface MultiSelectProps {
  /** Available options to select from */
  options: MultiSelectOption[];
  /** Currently selected values */
  value?: string[];
  /** Callback when selection changes */
  onChange?: (value: string[]) => void;
  /** Placeholder text when nothing is selected */
  placeholder?: string;
  /** Placeholder text for the search input */
  searchPlaceholder?: string;
  /** Text to display when no options match the search */
  emptyText?: string;
  /** Whether the multi-select is disabled */
  disabled?: boolean;
  /** Whether the multi-select is loading */
  loading?: boolean;
  /** Additional class name for the trigger button */
  className?: string;
  /** Maximum number of items to show in the trigger before collapsing */
  maxDisplayItems?: number;
  /** Callback when search value changes (for async search) */
  onSearchChange?: (search: string) => void;
  /** ID for accessibility */
  id?: string;
  /** Maximum number of items that can be selected */
  maxItems?: number;
  /** Custom render function for selected badges */
  renderBadge?: (option: MultiSelectOption, onRemove: () => void) => React.ReactNode;
  /** Custom render function for options in the dropdown */
  renderOption?: (option: MultiSelectOption, isSelected: boolean) => React.ReactNode;
  /** Badge variant to use */
  badgeVariant?: "default" | "secondary" | "destructive" | "outline";
}

/* -----------------------------------------------------------------------------
 * MultiSelect Component
 * -------------------------------------------------------------------------- */

function MultiSelect({
  options,
  value = [],
  onChange,
  placeholder = "Select items...",
  searchPlaceholder = "Search...",
  emptyText = "No results found.",
  disabled = false,
  loading = false,
  className,
  maxDisplayItems = 3,
  onSearchChange,
  id,
  maxItems,
  renderBadge,
  renderOption,
  badgeVariant = "secondary",
}: MultiSelectProps) {
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState("");

  const selectedOptions = options.filter((opt) => value.includes(opt.value));

  // Group options if they have group property
  const groupedOptions = React.useMemo(() => {
    const groups = new Map<string, MultiSelectOption[]>();
    const ungrouped: MultiSelectOption[] = [];

    options.forEach((option) => {
      if (option.group) {
        const group = groups.get(option.group) || [];
        group.push(option);
        groups.set(option.group, group);
      } else {
        ungrouped.push(option);
      }
    });

    return { groups, ungrouped };
  }, [options]);

  const handleSearchChange = (searchValue: string) => {
    setSearch(searchValue);
    onSearchChange?.(searchValue);
  };

  const handleSelect = (selectedValue: string) => {
    const isSelected = value.includes(selectedValue);
    let newValue: string[];

    if (isSelected) {
      newValue = value.filter((v) => v !== selectedValue);
    } else {
      if (maxItems && value.length >= maxItems) {
        return;
      }
      newValue = [...value, selectedValue];
    }

    onChange?.(newValue);
  };

  const handleRemove = (valueToRemove: string) => {
    onChange?.(value.filter((v) => v !== valueToRemove));
  };

  const handleClearAll = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange?.([]);
  };

  const defaultRenderBadge = (option: MultiSelectOption, onRemove: () => void) => (
    <Badge
      variant={badgeVariant}
      className="mr-1 mb-1"
      style={option.color ? { backgroundColor: option.color, color: "white" } : undefined}
    >
      {option.icon && <span className="mr-1">{option.icon}</span>}
      {option.label}
      <button
        type="button"
        className="ml-1 rounded-full outline-none ring-offset-background focus:ring-2 focus:ring-ring focus:ring-offset-2"
        onMouseDown={(e) => {
          e.preventDefault();
          e.stopPropagation();
        }}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onRemove();
        }}
      >
        <X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
      </button>
    </Badge>
  );

  const defaultRenderOption = (option: MultiSelectOption, isSelected: boolean) => (
    <>
      <div
        className={cn(
          "mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary",
          isSelected
            ? "bg-primary text-primary-foreground"
            : "opacity-50 [&_svg]:invisible"
        )}
      >
        <Check className="h-4 w-4" />
      </div>
      {option.icon && <span className="mr-2">{option.icon}</span>}
      <div className="flex flex-col">
        <span>{option.label}</span>
        {option.description && (
          <span className="text-xs text-muted-foreground">
            {option.description}
          </span>
        )}
      </div>
    </>
  );

  const displayedOptions = selectedOptions.slice(0, maxDisplayItems);
  const remainingCount = selectedOptions.length - maxDisplayItems;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn(
            "w-full justify-between font-normal min-h-9 h-auto",
            !value.length && "text-muted-foreground",
            className
          )}
        >
          <div className="flex flex-wrap items-center gap-1">
            {value.length === 0 ? (
              <span>{placeholder}</span>
            ) : (
              <>
                {displayedOptions.map((option) =>
                  renderBadge
                    ? renderBadge(option, () => handleRemove(option.value))
                    : defaultRenderBadge(option, () => handleRemove(option.value))
                )}
                {remainingCount > 0 && (
                  <Badge variant="secondary" className="mr-1">
                    +{remainingCount} more
                  </Badge>
                )}
              </>
            )}
          </div>
          <div className="flex items-center gap-1">
            {value.length > 0 && (
              <X
                className="h-4 w-4 opacity-50 hover:opacity-100"
                onClick={handleClearAll}
              />
            )}
            {loading ? (
              <Loader2 className="h-4 w-4 shrink-0 animate-spin opacity-50" />
            ) : (
              <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
            )}
          </div>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
        <Command shouldFilter={!onSearchChange}>
          <CommandInput
            placeholder={searchPlaceholder}
            value={search}
            onValueChange={handleSearchChange}
          />
          <CommandList>
            {loading ? (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="h-4 w-4 animate-spin" />
              </div>
            ) : (
              <>
                <CommandEmpty>{emptyText}</CommandEmpty>
                {/* Render ungrouped options */}
                {groupedOptions.ungrouped.length > 0 && (
                  <CommandGroup>
                    {groupedOptions.ungrouped.map((option) => {
                      const isSelected = value.includes(option.value);
                      const isDisabled = Boolean(
                        option.disabled ||
                        (maxItems && !isSelected && value.length >= maxItems)
                      );

                      return (
                        <CommandItem
                          key={option.value}
                          value={option.value}
                          disabled={isDisabled}
                          onSelect={handleSelect}
                          className="cursor-pointer"
                        >
                          {renderOption
                            ? renderOption(option, isSelected)
                            : defaultRenderOption(option, isSelected)}
                        </CommandItem>
                      );
                    })}
                  </CommandGroup>
                )}
                {/* Render grouped options */}
                {Array.from(groupedOptions.groups.entries()).map(
                  ([groupName, groupOptions]) => (
                    <CommandGroup key={groupName} heading={groupName}>
                      {groupOptions.map((option) => {
                        const isSelected = value.includes(option.value);
                        const isDisabled = Boolean(
                          option.disabled ||
                          (maxItems && !isSelected && value.length >= maxItems)
                        );

                        return (
                          <CommandItem
                            key={option.value}
                            value={option.value}
                            disabled={isDisabled}
                            onSelect={handleSelect}
                            className="cursor-pointer"
                          >
                            {renderOption
                              ? renderOption(option, isSelected)
                              : defaultRenderOption(option, isSelected)}
                          </CommandItem>
                        );
                      })}
                    </CommandGroup>
                  )
                )}
              </>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

/* -----------------------------------------------------------------------------
 * TagInput Component (simpler multi-select for creating tags)
 * -------------------------------------------------------------------------- */

export interface TagInputProps {
  /** Currently entered tags */
  value?: string[];
  /** Callback when tags change */
  onChange?: (value: string[]) => void;
  /** Placeholder text */
  placeholder?: string;
  /** Whether the input is disabled */
  disabled?: boolean;
  /** Additional class name */
  className?: string;
  /** Maximum number of tags allowed */
  maxTags?: number;
  /** Suggested tags to show in dropdown */
  suggestions?: string[];
  /** Allow creating new tags not in suggestions */
  allowCreate?: boolean;
  /** Badge variant to use */
  badgeVariant?: "default" | "secondary" | "destructive" | "outline";
  /** ID for accessibility */
  id?: string;
}

function TagInput({
  value = [],
  onChange,
  placeholder = "Add tags...",
  disabled = false,
  className,
  maxTags,
  suggestions = [],
  allowCreate = true,
  badgeVariant = "secondary",
  id,
}: TagInputProps) {
  const [inputValue, setInputValue] = React.useState("");
  const [open, setOpen] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const filteredSuggestions = suggestions.filter(
    (suggestion) =>
      suggestion.toLowerCase().includes(inputValue.toLowerCase()) &&
      !value.includes(suggestion)
  );

  const canAddMore = !maxTags || value.length < maxTags;

  const addTag = (tag: string) => {
    const trimmedTag = tag.trim();
    if (trimmedTag && !value.includes(trimmedTag) && canAddMore) {
      onChange?.([...value, trimmedTag]);
      setInputValue("");
    }
  };

  const removeTag = (tagToRemove: string) => {
    onChange?.(value.filter((tag) => tag !== tagToRemove));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && inputValue && allowCreate) {
      e.preventDefault();
      addTag(inputValue);
    } else if (e.key === "Backspace" && !inputValue && value.length > 0) {
      removeTag(value[value.length - 1]);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  };

  const showDropdown = open && (filteredSuggestions.length > 0 || Boolean(allowCreate && inputValue));

  return (
    <Popover open={showDropdown} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <div
          className={cn(
            "flex min-h-9 w-full flex-wrap items-center gap-1 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-within:ring-1 focus-within:ring-ring",
            disabled && "cursor-not-allowed opacity-50",
            className
          )}
          onClick={() => inputRef.current?.focus()}
        >
          {value.map((tag) => (
            <Badge key={tag} variant={badgeVariant} className="mr-1">
              {tag}
              {!disabled && (
                <button
                  type="button"
                  className="ml-1 rounded-full outline-none ring-offset-background focus:ring-2 focus:ring-ring focus:ring-offset-2"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeTag(tag);
                  }}
                >
                  <X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                </button>
              )}
            </Badge>
          ))}
          <input
            ref={inputRef}
            id={id}
            type="text"
            value={inputValue}
            onChange={(e) => {
              setInputValue(e.target.value);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            onKeyDown={handleKeyDown}
            disabled={disabled || !canAddMore}
            placeholder={value.length === 0 ? placeholder : canAddMore ? "" : ""}
            className="flex-1 bg-transparent outline-none placeholder:text-muted-foreground min-w-[60px]"
          />
        </div>
      </PopoverTrigger>
      <PopoverContent
        className="w-[--radix-popover-trigger-width] p-0"
        align="start"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <Command>
          <CommandList>
            {filteredSuggestions.length === 0 && allowCreate && inputValue ? (
              <CommandItem
                onSelect={() => addTag(inputValue)}
                className="cursor-pointer"
              >
                Create &quot;{inputValue}&quot;
              </CommandItem>
            ) : (
              <CommandGroup>
                {filteredSuggestions.map((suggestion) => (
                  <CommandItem
                    key={suggestion}
                    value={suggestion}
                    onSelect={() => addTag(suggestion)}
                    className="cursor-pointer"
                  >
                    {suggestion}
                  </CommandItem>
                ))}
                {allowCreate && inputValue && !filteredSuggestions.includes(inputValue) && (
                  <CommandItem
                    onSelect={() => addTag(inputValue)}
                    className="cursor-pointer"
                  >
                    Create &quot;{inputValue}&quot;
                  </CommandItem>
                )}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

export { MultiSelect, TagInput };
