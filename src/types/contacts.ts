// Types for Contact components
// Note: When convex is running, you can import Id from "@convex/_generated/dataModel"
// For now, we'll use string types for IDs

export type Id<T extends string> = string & { __tableName: T };

export interface ContactAddress {
  street?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
}

export interface Contact {
  _id: Id<"contacts">;
  _creationTime: number;
  firstName?: string;
  lastName: string;
  email?: string;
  phone?: string;
  avatarUrl?: string;
  companyId?: Id<"companies">;
  title?: string;
  address?: ContactAddress;
  linkedinUrl?: string;
  twitterHandle?: string;
  source?: string;
  ownerId?: Id<"users">;
  tags: string[];
  enrichedAt?: number;
  enrichmentData?: unknown;
  aiScore?: number;
  createdAt: number;
  updatedAt: number;
  lastActivityAt?: number;
}

export interface Company {
  _id: Id<"companies">;
  _creationTime: number;
  name: string;
  domain?: string;
  logoUrl?: string;
}

export interface ContactWithCompany extends Contact {
  company?: Company | null;
}

export interface ContactFormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  companyId: string;
  title: string;
  tags: string[];
  address: {
    street: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
}
