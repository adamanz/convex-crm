"use client";

import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { Id } from "../../../../../convex/_generated/dataModel";
import { Camera, Save, Loader2, Bell, Mail, MessageSquare, User, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { toast } from "sonner";

interface ProfileFormData {
  firstName: string;
  lastName: string;
  email: string;
  avatarUrl: string;
}

interface NotificationPreferences {
  emailNotifications: boolean;
  taskReminders: boolean;
  dealUpdates: boolean;
  messageNotifications: boolean;
  weeklyDigest: boolean;
}

export default function ProfileSettingsPage() {
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Convex queries and mutations
  const usersData = useQuery(api.users.list, { includeInactive: false });
  const updateUser = useMutation(api.users.update);
  const generateUploadUrl = useMutation(api.files.generateUploadUrl);

  const currentUser = usersData?.[0];
  const currentUserId = currentUser?._id;

  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [formData, setFormData] = useState<ProfileFormData>({
    firstName: "",
    lastName: "",
    email: "",
    avatarUrl: "",
  });

  const [notifications, setNotifications] = useState<NotificationPreferences>({
    emailNotifications: true,
    taskReminders: true,
    dealUpdates: true,
    messageNotifications: true,
    weeklyDigest: false,
  });

  // Sync user data to form when loaded
  useEffect(() => {
    if (currentUser && !hasUnsavedChanges) {
      setFormData({
        firstName: currentUser.firstName ?? "",
        lastName: currentUser.lastName ?? "",
        email: currentUser.email ?? "",
        avatarUrl: currentUser.avatarUrl ?? "",
      });

      // Load notification preferences
      if (currentUser.preferences?.notifications) {
        setNotifications(currentUser.preferences.notifications);
      }
    }
  }, [currentUser, hasUnsavedChanges]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setHasUnsavedChanges(true);
  };

  const handleNotificationChange = (key: keyof NotificationPreferences) => {
    setNotifications((prev) => ({ ...prev, [key]: !prev[key] }));
    setHasUnsavedChanges(true);
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file");
      return;
    }

    // Validate file size (2MB max)
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Image size must be less than 2MB");
      return;
    }

    setIsUploadingAvatar(true);

    try {
      // Generate upload URL
      const uploadUrl = await generateUploadUrl();

      // Upload the file
      const result = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": file.type },
        body: file,
      });

      if (!result.ok) {
        throw new Error("Failed to upload image");
      }

      const { storageId } = await result.json();

      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);

      // Update user immediately with the storage URL
      if (currentUserId) {
        // In Convex, we need to get the URL from storage
        // For now, we'll store the storageId and update the user
        await updateUser({
          id: currentUserId,
          avatarUrl: storageId, // Store the storage ID
        });

        toast.success("Avatar updated successfully");
        setAvatarPreview(null);
      }
    } catch (error) {
      console.error("Avatar upload error:", error);
      toast.error("Failed to upload avatar");
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleSave = async () => {
    if (!currentUserId) {
      toast.error("No user found. Please refresh and try again.");
      return;
    }

    setIsSaving(true);

    try {
      // Build preferences object
      const updatedPreferences = {
        ...currentUser?.preferences,
        notifications,
      };

      await updateUser({
        id: currentUserId,
        firstName: formData.firstName || undefined,
        lastName: formData.lastName || undefined,
        preferences: updatedPreferences,
      });

      setHasUnsavedChanges(false);
      toast.success("Profile updated successfully");
    } catch (error) {
      toast.error("Failed to update profile");
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  const getInitials = () => {
    const first = formData.firstName?.charAt(0)?.toUpperCase() || "";
    const last = formData.lastName?.charAt(0)?.toUpperCase() || "";
    return first + last || "?";
  };

  // Loading state
  if (usersData === undefined) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
      </div>
    );
  }

  // No user found state
  if (!currentUser) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
            Profile Settings
          </h1>
          <p className="mt-1 text-zinc-500 dark:text-zinc-400">
            No user profile found. Please create a user first.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-4xl">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
          Profile Settings
        </h1>
        <p className="mt-1 text-zinc-500 dark:text-zinc-400">
          Manage your personal information and account preferences
        </p>
      </div>

      {/* Avatar Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Camera className="h-5 w-5 text-zinc-500" />
            <CardTitle>Profile Photo</CardTitle>
          </div>
          <CardDescription>
            Upload a profile picture to personalize your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-6">
            <div className="relative">
              <div
                onClick={handleAvatarClick}
                className="group relative h-24 w-24 cursor-pointer overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800 ring-2 ring-zinc-200 dark:ring-zinc-700"
              >
                {isUploadingAvatar ? (
                  <div className="flex h-full w-full items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
                  </div>
                ) : avatarPreview || formData.avatarUrl ? (
                  <img
                    src={avatarPreview || formData.avatarUrl}
                    alt="Profile"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-2xl font-semibold text-zinc-600 dark:text-zinc-300">
                    {getInitials()}
                  </div>
                )}
                <div className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 transition-opacity group-hover:opacity-100">
                  <Camera className="h-6 w-6 text-white" />
                </div>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                disabled={isUploadingAvatar}
                className="hidden"
              />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                Click to upload new photo
              </p>
              <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                JPG, PNG or GIF. Max size 2MB.
              </p>
              <p className="mt-1 text-xs text-zinc-400 dark:text-zinc-500">
                Recommended: Square image, at least 400x400px
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Personal Information */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <User className="h-5 w-5 text-zinc-500" />
            <CardTitle>Personal Information</CardTitle>
          </div>
          <CardDescription>
            Update your name and contact details
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-6 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="firstName">
                First Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="firstName"
                name="firstName"
                value={formData.firstName}
                onChange={handleInputChange}
                placeholder="Enter your first name"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">
                Last Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="lastName"
                name="lastName"
                value={formData.lastName}
                onChange={handleInputChange}
                placeholder="Enter your last name"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              disabled
              className="bg-zinc-50 dark:bg-zinc-900 cursor-not-allowed"
            />
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Your email address is managed by your authentication provider and cannot be changed here
            </p>
          </div>

          <div className="space-y-2">
            <Label>User Role</Label>
            <div className="flex items-center gap-2">
              <div className="inline-flex items-center rounded-md bg-zinc-100 dark:bg-zinc-800 px-3 py-1.5 text-sm font-medium text-zinc-700 dark:text-zinc-300 capitalize">
                {currentUser.role}
              </div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Contact an admin to change your role
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notification Preferences */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-zinc-500" />
            <CardTitle>Notification Preferences</CardTitle>
          </div>
          <CardDescription>
            Manage how you receive notifications and updates
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-zinc-400" />
                  <Label htmlFor="emailNotifications" className="font-medium">
                    Email Notifications
                  </Label>
                </div>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">
                  Receive email notifications for important updates
                </p>
              </div>
              <Switch
                id="emailNotifications"
                checked={notifications.emailNotifications}
                onCheckedChange={() => handleNotificationChange("emailNotifications")}
              />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <Bell className="h-4 w-4 text-zinc-400" />
                  <Label htmlFor="taskReminders" className="font-medium">
                    Task Reminders
                  </Label>
                </div>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">
                  Get notified about upcoming and overdue tasks
                </p>
              </div>
              <Switch
                id="taskReminders"
                checked={notifications.taskReminders}
                onCheckedChange={() => handleNotificationChange("taskReminders")}
              />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <Bell className="h-4 w-4 text-zinc-400" />
                  <Label htmlFor="dealUpdates" className="font-medium">
                    Deal Updates
                  </Label>
                </div>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">
                  Notifications when deals change stages or close
                </p>
              </div>
              <Switch
                id="dealUpdates"
                checked={notifications.dealUpdates}
                onCheckedChange={() => handleNotificationChange("dealUpdates")}
              />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-zinc-400" />
                  <Label htmlFor="messageNotifications" className="font-medium">
                    Message Notifications
                  </Label>
                </div>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">
                  Get notified about new messages and mentions
                </p>
              </div>
              <Switch
                id="messageNotifications"
                checked={notifications.messageNotifications}
                onCheckedChange={() => handleNotificationChange("messageNotifications")}
              />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-zinc-400" />
                  <Label htmlFor="weeklyDigest" className="font-medium">
                    Weekly Digest
                  </Label>
                </div>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">
                  Receive a weekly summary of your activity
                </p>
              </div>
              <Switch
                id="weeklyDigest"
                checked={notifications.weeklyDigest}
                onCheckedChange={() => handleNotificationChange("weeklyDigest")}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Security Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Lock className="h-5 w-5 text-zinc-500" />
            <CardTitle>Security</CardTitle>
          </div>
          <CardDescription>
            Manage your password and security settings
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="rounded-lg bg-zinc-50 dark:bg-zinc-900 p-4">
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                Password management is handled by your authentication provider (Clerk).
                To change your password, please visit your{" "}
                <a
                  href="https://accounts.clerk.dev"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 underline"
                >
                  account settings
                </a>
                .
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex items-center justify-between gap-4 sticky bottom-0 bg-white dark:bg-zinc-950 py-4 border-t border-zinc-200 dark:border-zinc-800">
        <div>
          {hasUnsavedChanges && (
            <span className="text-sm text-amber-600 dark:text-amber-400">
              You have unsaved changes
            </span>
          )}
        </div>
        <Button
          onClick={handleSave}
          disabled={isSaving || !hasUnsavedChanges}
          className="min-w-32"
          size="lg"
        >
          {isSaving ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="h-4 w-4" />
              Save Changes
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
