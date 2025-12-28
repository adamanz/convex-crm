// Types for User components

export type Id<T extends string> = string & { __tableName: T };

export type UserRole = "admin" | "manager" | "member";

export interface User {
  _id: Id<"users">;
  _creationTime: number;
  clerkId?: string;
  email: string;
  firstName?: string;
  lastName?: string;
  avatarUrl?: string;
  role: UserRole;
  preferences?: unknown;
  isActive: boolean;
  lastActiveAt: number;
  createdAt: number;
}

export interface UserWithStats extends User {
  stats?: {
    contactsOwned: number;
    dealsOwned: number;
    activitiesCreated: number;
    totalDealValue: number;
  };
}

export interface TeamStats {
  totalMembers: number;
  activeMembers: number;
  admins: number;
  managers: number;
  members: number;
  recentlyActive: number;
}

export interface InviteUserFormData {
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
}
