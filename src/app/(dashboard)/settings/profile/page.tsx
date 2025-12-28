"use client";

import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { Id } from "../../../../../convex/_generated/dataModel";
import { Camera, Save, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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

export default function ProfileSettingsPage() {
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Convex queries and mutations
  // Get the first active user as the "current" user (until proper auth is implemented)
  const usersData = useQuery(api.users.list, { includeInactive: false });
  const updateUser = useMutation(api.users.update);

  const currentUser = usersData?.[0];
  const currentUserId = currentUser?._id;

  const [isSaving, setIsSaving] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [formData, setFormData] = useState<ProfileFormData>({
    firstName: "",
    lastName: "",
    email: "",
    avatarUrl: "",
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
    }
  }, [currentUser, hasUnsavedChanges]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setHasUnsavedChanges(true);
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
        setHasUnsavedChanges(true);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    if (!currentUserId) {
      toast.error("No user found. Please refresh and try again.");
      return;
    }

    setIsSaving(true);

    try {
      await updateUser({
        id: currentUserId,
        firstName: formData.firstName || undefined,
        lastName: formData.lastName || undefined,
        // Note: avatarUrl would need file upload handling with Convex storage
        // For now, we save any URL directly (e.g., from a preview or external URL)
        avatarUrl: avatarPreview || formData.avatarUrl || undefined,
      });

      setHasUnsavedChanges(false);
      // Clear the preview since it's now saved
      if (avatarPreview) {
        setFormData((prev) => ({ ...prev, avatarUrl: avatarPreview }));
        setAvatarPreview(null);
      }
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
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
          Profile Settings
        </h1>
        <p className="mt-1 text-zinc-500 dark:text-zinc-400">
          Manage your personal information and account details
        </p>
      </div>

      {/* Avatar Section */}
      <Card>
        <CardHeader>
          <CardTitle>Avatar</CardTitle>
          <CardDescription>
            Upload a profile picture to personalize your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-6">
            <div className="relative">
              <div
                onClick={handleAvatarClick}
                className="group relative h-24 w-24 cursor-pointer overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800"
              >
                {avatarPreview || formData.avatarUrl ? (
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
                <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
                  <Camera className="h-6 w-6 text-white" />
                </div>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                className="hidden"
              />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Click to upload
              </p>
              <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                JPG, PNG or GIF. Max size 2MB.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Personal Information */}
      <Card>
        <CardHeader>
          <CardTitle>Personal Information</CardTitle>
          <CardDescription>
            Update your name and contact details
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-6 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name</Label>
              <Input
                id="firstName"
                name="firstName"
                value={formData.firstName}
                onChange={handleInputChange}
                placeholder="Enter your first name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name</Label>
              <Input
                id="lastName"
                name="lastName"
                value={formData.lastName}
                onChange={handleInputChange}
                placeholder="Enter your last name"
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
              className="bg-zinc-50 dark:bg-zinc-900"
            />
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Your email address is managed by your authentication provider
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex items-center justify-end gap-4">
        {hasUnsavedChanges && (
          <span className="text-sm text-amber-600 dark:text-amber-400">
            You have unsaved changes
          </span>
        )}
        <Button
          onClick={handleSave}
          disabled={isSaving || !hasUnsavedChanges}
          className="min-w-32"
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
