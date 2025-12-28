# Profile Settings Page - Component Structure

## Page Layout

```
┌─────────────────────────────────────────────────────────────┐
│  Profile Settings                                            │
│  Manage your personal information and account preferences   │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  📷 Profile Photo                                           │
│  Upload a profile picture to personalize your account       │
│                                                              │
│  ┌─────┐                                                    │
│  │     │  Click to upload new photo                         │
│  │ AB  │  JPG, PNG or GIF. Max size 2MB.                   │
│  │     │  Recommended: Square image, at least 400x400px     │
│  └─────┘                                                    │
│  (Avatar with hover effect)                                 │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  👤 Personal Information                                    │
│  Update your name and contact details                       │
│                                                              │
│  First Name *          Last Name *                          │
│  ┌─────────────┐      ┌─────────────┐                      │
│  │ Adam        │      │ Anzuoni     │                      │
│  └─────────────┘      └─────────────┘                      │
│                                                              │
│  Email Address                                               │
│  ┌──────────────────────────────────┐                      │
│  │ adam@example.com                 │ (disabled)           │
│  └──────────────────────────────────┘                      │
│  Your email address is managed by your authentication       │
│  provider and cannot be changed here                        │
│                                                              │
│  User Role                                                   │
│  [admin]  Contact an admin to change your role             │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  🔔 Notification Preferences                                │
│  Manage how you receive notifications and updates           │
│                                                              │
│  📧 Email Notifications                          [●─────]   │
│  Receive email notifications for important updates          │
│  ─────────────────────────────────────────────────────────  │
│                                                              │
│  🔔 Task Reminders                               [●─────]   │
│  Get notified about upcoming and overdue tasks              │
│  ─────────────────────────────────────────────────────────  │
│                                                              │
│  🔔 Deal Updates                                 [●─────]   │
│  Notifications when deals change stages or close            │
│  ─────────────────────────────────────────────────────────  │
│                                                              │
│  💬 Message Notifications                        [●─────]   │
│  Get notified about new messages and mentions               │
│  ─────────────────────────────────────────────────────────  │
│                                                              │
│  📧 Weekly Digest                                [─────●]   │
│  Receive a weekly summary of your activity                  │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  🔒 Security                                                │
│  Manage your password and security settings                 │
│                                                              │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Password management is handled by your              │   │
│  │ authentication provider (Clerk). To change your     │   │
│  │ password, please visit your account settings.       │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  You have unsaved changes          [💾 Save Changes]       │
└─────────────────────────────────────────────────────────────┘
(Sticky footer)
```

## Component Hierarchy

```
ProfileSettingsPage
├── PageHeader
│   ├── Title: "Profile Settings"
│   └── Description: "Manage your personal information..."
│
├── AvatarCard
│   ├── CardHeader (Camera icon + "Profile Photo")
│   ├── CardContent
│   │   ├── AvatarUpload
│   │   │   ├── Avatar display (image or initials)
│   │   │   ├── Hover overlay (camera icon)
│   │   │   └── Hidden file input
│   │   └── UploadInstructions
│   │       ├── "Click to upload new photo"
│   │       ├── File type/size info
│   │       └── Recommendation
│
├── PersonalInfoCard
│   ├── CardHeader (User icon + "Personal Information")
│   ├── CardContent
│   │   ├── NameFields (Grid layout)
│   │   │   ├── FirstNameInput (required)
│   │   │   └── LastNameInput (required)
│   │   ├── EmailField (disabled)
│   │   │   ├── Input (read-only)
│   │   │   └── HelpText
│   │   └── RoleDisplay
│   │       ├── RoleBadge
│   │       └── HelpText
│
├── NotificationPreferencesCard
│   ├── CardHeader (Bell icon + "Notification Preferences")
│   ├── CardContent
│   │   ├── EmailNotifications
│   │   │   ├── Label + Description
│   │   │   └── Switch
│   │   ├── Separator
│   │   ├── TaskReminders
│   │   │   ├── Label + Description
│   │   │   └── Switch
│   │   ├── Separator
│   │   ├── DealUpdates
│   │   │   ├── Label + Description
│   │   │   └── Switch
│   │   ├── Separator
│   │   ├── MessageNotifications
│   │   │   ├── Label + Description
│   │   │   └── Switch
│   │   ├── Separator
│   │   └── WeeklyDigest
│   │       ├── Label + Description
│   │       └── Switch
│
├── SecurityCard
│   ├── CardHeader (Lock icon + "Security")
│   ├── CardContent
│   │   └── PasswordInfo
│   │       └── InfoBox with link to Clerk
│
└── StickyFooter
    ├── UnsavedChangesWarning (conditional)
    └── SaveButton
        ├── Save icon
        └── "Save Changes" text
        └── Loading state (spinner)
```

## State Management

### Local State Variables

```typescript
// Form data
const [formData, setFormData] = useState<ProfileFormData>({
  firstName: "",
  lastName: "",
  email: "",
  avatarUrl: "",
});

// Notification preferences
const [notifications, setNotifications] = useState<NotificationPreferences>({
  emailNotifications: true,
  taskReminders: true,
  dealUpdates: true,
  messageNotifications: true,
  weeklyDigest: false,
});

// UI state
const [isSaving, setIsSaving] = useState(false);
const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

// Refs
const fileInputRef = useRef<HTMLInputElement>(null);
```

### Convex Hooks

```typescript
// Queries
const usersData = useQuery(api.users.list, { includeInactive: false });

// Mutations
const updateUser = useMutation(api.users.update);
const generateUploadUrl = useMutation(api.files.generateUploadUrl);

// Derived data
const currentUser = usersData?.[0];
const currentUserId = currentUser?._id;
```

## Event Handlers

### Avatar Upload Flow
```
handleAvatarClick() → fileInputRef.current?.click()
  ↓
handleAvatarChange(e)
  ├── Validate file type
  ├── Validate file size (2MB)
  ├── setIsUploadingAvatar(true)
  ├── generateUploadUrl()
  ├── fetch(uploadUrl, { file })
  ├── Get storageId
  ├── updateUser({ avatarUrl: storageId })
  ├── Create preview (FileReader)
  ├── toast.success()
  └── setIsUploadingAvatar(false)
```

### Form Input Flow
```
handleInputChange(e)
  ├── setFormData({ ...prev, [name]: value })
  └── setHasUnsavedChanges(true)
```

### Notification Toggle Flow
```
handleNotificationChange(key)
  ├── setNotifications({ ...prev, [key]: !prev[key] })
  └── setHasUnsavedChanges(true)
```

### Save Flow
```
handleSave()
  ├── setIsSaving(true)
  ├── Build updatedPreferences object
  ├── updateUser({
  │     firstName,
  │     lastName,
  │     preferences: updatedPreferences
  │   })
  ├── setHasUnsavedChanges(false)
  ├── toast.success()
  └── setIsSaving(false)
```

## Loading States

### Initial Load
```
usersData === undefined
  ↓
<Loader2 className="animate-spin" />
```

### No User Found
```
!currentUser
  ↓
"No user profile found. Please create a user first."
```

### Avatar Upload
```
isUploadingAvatar === true
  ↓
Avatar shows <Loader2 className="animate-spin" />
```

### Saving
```
isSaving === true
  ↓
Button shows "Saving..." with spinner
```

## Conditional Rendering

### Unsaved Changes Warning
```tsx
{hasUnsavedChanges && (
  <span className="text-amber-600">
    You have unsaved changes
  </span>
)}
```

### Save Button State
```tsx
<Button
  onClick={handleSave}
  disabled={isSaving || !hasUnsavedChanges}
>
  {isSaving ? "Saving..." : "Save Changes"}
</Button>
```

### Avatar Display
```tsx
{isUploadingAvatar ? (
  <Loader2 />
) : avatarPreview || formData.avatarUrl ? (
  <img src={avatarPreview || formData.avatarUrl} />
) : (
  <div>{getInitials()}</div>
)}
```

## Styling Classes

### Card Layout
```css
.space-y-8        /* Vertical spacing between cards */
.max-w-4xl        /* Maximum width constraint */
```

### Avatar
```css
.h-24.w-24                    /* Size */
.rounded-full                 /* Circle shape */
.ring-2.ring-zinc-200         /* Border ring */
.cursor-pointer               /* Clickable cursor */
.group-hover:opacity-100      /* Hover effect */
```

### Form Grid
```css
.grid.gap-6.sm:grid-cols-2   /* Responsive grid */
```

### Sticky Footer
```css
.sticky.bottom-0              /* Stick to bottom */
.border-t                     /* Top border */
.bg-white.dark:bg-zinc-950   /* Background */
```

## Accessibility Features

### Labels
- All inputs have associated `<Label>` components
- Labels have `htmlFor` matching input IDs

### Required Fields
- Visual indicator with red asterisk
- HTML5 `required` attribute

### Disabled States
- Email field disabled with visual feedback
- Save button disabled when no changes
- Avatar upload disabled during upload

### Keyboard Navigation
- Proper tab order through form
- Enter key submits (handled by button)

### Screen Readers
- Semantic HTML structure
- Descriptive labels and help text
- Icon-only elements have sr-only text

## Dark Mode Support

All components support dark mode via Tailwind's `dark:` prefix:
- `dark:bg-zinc-950` - Dark backgrounds
- `dark:text-zinc-100` - Light text
- `dark:border-zinc-800` - Dark borders
- `dark:ring-zinc-700` - Dark rings

## Toast Notifications

### Success Messages
- "Avatar updated successfully"
- "Profile updated successfully"

### Error Messages
- "Please upload an image file"
- "Image size must be less than 2MB"
- "Failed to upload avatar"
- "Failed to update profile"
- "No user found. Please refresh and try again."

## Data Persistence

### Saved to Database
```typescript
{
  firstName: string,
  lastName: string,
  avatarUrl: string,  // Convex storage ID
  preferences: {
    notifications: {
      emailNotifications: boolean,
      taskReminders: boolean,
      dealUpdates: boolean,
      messageNotifications: boolean,
      weeklyDigest: boolean
    }
  }
}
```

### Not Saved (Managed by Clerk)
- Email address
- Password
- User role (requires admin)
