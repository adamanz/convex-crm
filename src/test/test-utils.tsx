import { ReactElement, ReactNode } from "react";
import { render, RenderOptions } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Id, Doc } from "../../convex/_generated/dataModel";

// Mock data factories
export function createMockCompany(
  overrides: Partial<Doc<"companies">> = {}
): Doc<"companies"> {
  return {
    _id: "company_1" as Id<"companies">,
    _creationTime: Date.now(),
    name: "Acme Inc",
    industry: "Technology",
    website: "https://acme.com",
    size: "51-200",
    address: {
      street: "123 Main St",
      city: "San Francisco",
      state: "CA",
      postalCode: "94105",
      country: "USA",
    },
    tags: [],
    createdAt: Date.now(),
    updatedAt: Date.now(),
    ...overrides,
  };
}

export function createMockContact(
  overrides: Partial<Doc<"contacts">> = {}
): Doc<"contacts"> {
  return {
    _id: "contact_1" as Id<"contacts">,
    _creationTime: Date.now(),
    firstName: "John",
    lastName: "Doe",
    email: "john@example.com",
    phone: "+1 555-123-4567",
    title: "Software Engineer",
    companyId: "company_1" as Id<"companies">,
    tags: [],
    createdAt: Date.now(),
    updatedAt: Date.now(),
    ...overrides,
  };
}

export function createMockContactWithCompany(
  overrides: Partial<Doc<"contacts"> & { company: Doc<"companies"> | null }> = {}
) {
  const contact = createMockContact(overrides);
  return {
    ...contact,
    company: overrides.company !== undefined ? overrides.company : createMockCompany(),
  };
}

export function createMockDeal(
  overrides: Partial<Doc<"deals">> = {}
): Doc<"deals"> {
  return {
    _id: "deal_1" as Id<"deals">,
    _creationTime: Date.now(),
    name: "Enterprise Deal",
    amount: 50000,
    currency: "USD",
    status: "open",
    pipelineId: "pipeline_1" as Id<"pipelines">,
    stageId: "stage_1",
    companyId: "company_1" as Id<"companies">,
    contactIds: [],
    ownerId: "user_1" as Id<"users">,
    probability: 75,
    expectedCloseDate: Date.now() + 30 * 24 * 60 * 60 * 1000, // 30 days from now
    tags: [],
    createdAt: Date.now(),
    updatedAt: Date.now(),
    stageChangedAt: Date.now(),
    ...overrides,
  };
}

export function createMockDealWithRelations(
  overrides: Partial<any> = {}
): any {
  const deal = createMockDeal(overrides);
  return {
    ...deal,
    company: overrides.company !== undefined ? overrides.company : createMockCompany(),
    contacts: overrides.contacts || [createMockContact()],
    owner: overrides.owner || {
      _id: "user_1" as Id<"users">,
      _creationTime: Date.now(),
      firstName: "Test",
      lastName: "User",
      email: "test@example.com",
    },
    pipeline: overrides.pipeline || {
      _id: "pipeline_1" as Id<"pipelines">,
      _creationTime: Date.now(),
      name: "Sales Pipeline",
      isDefault: true,
      stages: [
        { id: "stage_1", name: "Prospecting", color: "#3b82f6", order: 0, probability: 10 },
        { id: "stage_2", name: "Qualification", color: "#8b5cf6", order: 1, probability: 25 },
        { id: "stage_3", name: "Proposal", color: "#f59e0b", order: 2, probability: 50 },
        { id: "stage_4", name: "Negotiation", color: "#10b981", order: 3, probability: 75 },
        { id: "stage_5", name: "Closed Won", color: "#059669", order: 4, probability: 100 },
      ],
    },
    stageName: overrides.stageName || "Prospecting",
    stageColor: overrides.stageColor || "#3b82f6",
    activities: overrides.activities || [],
    history: overrides.history || [],
  };
}

export function createMockPipeline(
  overrides: Partial<Doc<"pipelines">> = {}
): Doc<"pipelines"> {
  return {
    _id: "pipeline_1" as Id<"pipelines">,
    _creationTime: Date.now(),
    name: "Sales Pipeline",
    isDefault: true,
    stages: [
      { id: "stage_1", name: "Prospecting", color: "#3b82f6", order: 0, probability: 10 },
      { id: "stage_2", name: "Qualification", color: "#8b5cf6", order: 1, probability: 25 },
      { id: "stage_3", name: "Proposal", color: "#f59e0b", order: 2, probability: 50 },
      { id: "stage_4", name: "Negotiation", color: "#10b981", order: 3, probability: 75 },
      { id: "stage_5", name: "Closed Won", color: "#059669", order: 4, probability: 100 },
    ],
    createdAt: Date.now(),
    updatedAt: Date.now(),
    ...overrides,
  };
}

export function createMockActivity(
  overrides: Partial<Doc<"activities">> = {}
): Doc<"activities"> {
  return {
    _id: "activity_123" as Id<"activities">,
    _creationTime: Date.now(),
    type: "task",
    subject: "Follow up with client",
    description: "Discuss pricing options",
    relatedToType: "contact",
    relatedToId: "contact_123",
    dueDate: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days from now
    completed: false,
    priority: "medium",
    ownerId: undefined,
    assignedToId: undefined,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    ...overrides,
  };
}

export function createMockUser(
  overrides: Partial<Doc<"users">> = {}
): Doc<"users"> {
  return {
    _id: "user_1" as Id<"users">,
    _creationTime: Date.now(),
    email: "test@example.com",
    firstName: "Test",
    lastName: "User",
    role: "admin",
    isActive: true,
    createdAt: Date.now(),
    lastActiveAt: Date.now(),
    ...overrides,
  };
}

// Custom render function with providers
interface CustomRenderOptions extends Omit<RenderOptions, "wrapper"> {
  initialState?: any;
}

export function customRender(
  ui: ReactElement,
  options?: CustomRenderOptions
) {
  const user = userEvent.setup();

  return {
    user,
    ...render(ui, {
      ...options,
    }),
  };
}

// Re-export everything from React Testing Library
export * from "@testing-library/react";
export { customRender as render };
