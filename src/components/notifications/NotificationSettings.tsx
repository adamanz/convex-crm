"use client";

import * as React from "react";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { cn } from "@/lib/utils";
import { ArrowLeft, Loader2 } from "lucide-react";

interface NotificationSettingsProps {
  onBack: () => void;
}

interface SettingToggleProps {
  label: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}

function SettingToggle({
  label,
  description,
  checked,
  onChange,
  disabled,
}: SettingToggleProps) {
  return (
    <label
      className={cn(
        "flex items-start gap-3 p-3 rounded-lg cursor-pointer transition-colors",
        "hover:bg-zinc-50 dark:hover:bg-zinc-800/50",
        disabled && "opacity-50 cursor-not-allowed"
      )}
    >
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
          {label}
        </p>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
          {description}
        </p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => !disabled && onChange(!checked)}
        className={cn(
          "relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full transition-colors",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2",
          checked
            ? "bg-blue-500"
            : "bg-zinc-200 dark:bg-zinc-700",
          disabled && "cursor-not-allowed"
        )}
      >
        <span
          className={cn(
            "pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow-sm transition-transform",
            "mt-0.5",
            checked ? "translate-x-4 ml-0.5" : "translate-x-0.5"
          )}
        />
      </button>
    </label>
  );
}

export function NotificationSettings({ onBack }: NotificationSettingsProps) {
  // Query current settings
  const settingsData = useQuery(api.notifications.getSettings, {});
  const isLoading = settingsData === undefined;

  // Local state for settings (would be synced with backend in real implementation)
  const [settings, setSettings] = React.useState({
    dealUpdates: true,
    taskReminders: true,
    mentions: true,
    systemAlerts: true,
    emailNotifications: false,
    pushNotifications: true,
  });

  // Update local state when data loads
  React.useEffect(() => {
    if (settingsData) {
      setSettings(settingsData);
    }
  }, [settingsData]);

  const handleSettingChange = (key: keyof typeof settings) => (value: boolean) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
    // In a real implementation, you'd call a mutation here to persist the change
  };

  if (isLoading) {
    return (
      <div className="flex flex-col h-full">
        <div className="flex items-center gap-2 border-b border-zinc-200 dark:border-zinc-800 px-4 py-3">
          <button
            onClick={onBack}
            className={cn(
              "flex h-7 w-7 items-center justify-center rounded-md transition-colors",
              "text-zinc-500 hover:text-zinc-700 hover:bg-zinc-100",
              "dark:text-zinc-400 dark:hover:text-zinc-200 dark:hover:bg-zinc-800"
            )}
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
            Notification Settings
          </h3>
        </div>
        <div className="flex items-center justify-center flex-1">
          <Loader2 className="h-6 w-6 animate-spin text-zinc-400" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-2 border-b border-zinc-200 dark:border-zinc-800 px-4 py-3">
        <button
          onClick={onBack}
          className={cn(
            "flex h-7 w-7 items-center justify-center rounded-md transition-colors",
            "text-zinc-500 hover:text-zinc-700 hover:bg-zinc-100",
            "dark:text-zinc-400 dark:hover:text-zinc-200 dark:hover:bg-zinc-800"
          )}
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
          Notification Settings
        </h3>
      </div>

      {/* Settings content */}
      <div className="flex-1 overflow-auto">
        {/* In-app notifications */}
        <div className="p-4">
          <h4 className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-2">
            In-App Notifications
          </h4>
          <div className="space-y-1">
            <SettingToggle
              label="Deal updates"
              description="When deals are won, lost, or change stages"
              checked={settings.dealUpdates}
              onChange={handleSettingChange("dealUpdates")}
            />
            <SettingToggle
              label="Task reminders"
              description="When tasks are assigned, due soon, or overdue"
              checked={settings.taskReminders}
              onChange={handleSettingChange("taskReminders")}
            />
            <SettingToggle
              label="Mentions"
              description="When someone mentions you in a note or comment"
              checked={settings.mentions}
              onChange={handleSettingChange("mentions")}
            />
            <SettingToggle
              label="System alerts"
              description="Important system updates and announcements"
              checked={settings.systemAlerts}
              onChange={handleSettingChange("systemAlerts")}
            />
          </div>
        </div>

        {/* Delivery preferences */}
        <div className="p-4 border-t border-zinc-200 dark:border-zinc-800">
          <h4 className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-2">
            Delivery Preferences
          </h4>
          <div className="space-y-1">
            <SettingToggle
              label="Email notifications"
              description="Receive important notifications via email"
              checked={settings.emailNotifications}
              onChange={handleSettingChange("emailNotifications")}
            />
            <SettingToggle
              label="Push notifications"
              description="Browser push notifications for real-time updates"
              checked={settings.pushNotifications}
              onChange={handleSettingChange("pushNotifications")}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
