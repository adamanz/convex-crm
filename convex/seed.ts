import { mutation, internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";

// ============================================================================
// SEED DATA - Realistic CRM data for development and testing
// ============================================================================

// Helper to generate timestamps relative to now
const now = Date.now();
const days = (n: number) => n * 24 * 60 * 60 * 1000;
const hours = (n: number) => n * 60 * 60 * 1000;

// ============================================================================
// SAMPLE DATA DEFINITIONS
// ============================================================================

const PIPELINE_STAGES = [
  { id: "lead", name: "Lead", color: "#6B7280", order: 0, probability: 10 },
  { id: "qualified", name: "Qualified", color: "#3B82F6", order: 1, probability: 25 },
  { id: "proposal", name: "Proposal", color: "#8B5CF6", order: 2, probability: 50 },
  { id: "negotiation", name: "Negotiation", color: "#F59E0B", order: 3, probability: 75 },
  { id: "closed_won", name: "Closed Won", color: "#10B981", order: 4, probability: 100 },
  { id: "closed_lost", name: "Closed Lost", color: "#EF4444", order: 5, probability: 0 },
];

const COMPANIES = [
  {
    name: "TechFlow Solutions",
    domain: "techflow.io",
    industry: "Software",
    size: "51-200",
    annualRevenue: 15000000,
    description: "Enterprise workflow automation platform helping companies streamline operations.",
    address: {
      street: "123 Innovation Drive",
      city: "San Francisco",
      state: "CA",
      postalCode: "94105",
      country: "USA",
    },
    phone: "+1 (415) 555-0123",
    website: "https://techflow.io",
    tags: ["enterprise", "saas", "automation"],
  },
  {
    name: "DataScale Analytics",
    domain: "datascale.com",
    industry: "Data Analytics",
    size: "201-500",
    annualRevenue: 45000000,
    description: "AI-powered business intelligence and analytics platform for data-driven decisions.",
    address: {
      street: "456 Market Street",
      city: "New York",
      state: "NY",
      postalCode: "10001",
      country: "USA",
    },
    phone: "+1 (212) 555-0456",
    website: "https://datascale.com",
    tags: ["analytics", "ai", "enterprise"],
  },
  {
    name: "CloudNine Infrastructure",
    domain: "cloudnine.dev",
    industry: "Cloud Services",
    size: "11-50",
    annualRevenue: 5000000,
    description: "Modern cloud infrastructure management and DevOps automation tools.",
    address: {
      street: "789 Tech Boulevard",
      city: "Austin",
      state: "TX",
      postalCode: "78701",
      country: "USA",
    },
    phone: "+1 (512) 555-0789",
    website: "https://cloudnine.dev",
    tags: ["cloud", "devops", "startup"],
  },
  {
    name: "SecureGuard Systems",
    domain: "secureguard.io",
    industry: "Cybersecurity",
    size: "51-200",
    annualRevenue: 25000000,
    description: "Enterprise cybersecurity solutions including threat detection and incident response.",
    address: {
      street: "321 Security Lane",
      city: "Seattle",
      state: "WA",
      postalCode: "98101",
      country: "USA",
    },
    phone: "+1 (206) 555-0321",
    website: "https://secureguard.io",
    tags: ["security", "enterprise", "compliance"],
  },
  {
    name: "GreenLeaf Technologies",
    domain: "greenleaftech.com",
    industry: "CleanTech",
    size: "11-50",
    annualRevenue: 8000000,
    description: "Sustainable technology solutions for energy management and carbon footprint tracking.",
    address: {
      street: "555 Eco Way",
      city: "Portland",
      state: "OR",
      postalCode: "97201",
      country: "USA",
    },
    phone: "+1 (503) 555-0555",
    website: "https://greenleaftech.com",
    tags: ["cleantech", "sustainability", "startup"],
  },
  {
    name: "HealthSync Medical",
    domain: "healthsync.med",
    industry: "Healthcare Tech",
    size: "201-500",
    annualRevenue: 60000000,
    description: "Healthcare interoperability platform connecting hospitals, clinics, and patient records.",
    address: {
      street: "888 Medical Center Drive",
      city: "Boston",
      state: "MA",
      postalCode: "02101",
      country: "USA",
    },
    phone: "+1 (617) 555-0888",
    website: "https://healthsync.med",
    tags: ["healthcare", "enterprise", "hipaa"],
  },
  {
    name: "FinEdge Capital",
    domain: "finedge.co",
    industry: "FinTech",
    size: "51-200",
    annualRevenue: 35000000,
    description: "Modern payment processing and financial infrastructure for businesses.",
    address: {
      street: "100 Wall Street",
      city: "New York",
      state: "NY",
      postalCode: "10005",
      country: "USA",
    },
    phone: "+1 (212) 555-0100",
    website: "https://finedge.co",
    tags: ["fintech", "payments", "enterprise"],
  },
];

const CONTACTS = [
  {
    firstName: "Sarah",
    lastName: "Chen",
    email: "sarah.chen@techflow.io",
    phone: "+1 (415) 555-1001",
    title: "VP of Engineering",
    companyIndex: 0,
    linkedinUrl: "https://linkedin.com/in/sarahchen",
    source: "Inbound",
    tags: ["decision-maker", "technical"],
  },
  {
    firstName: "Michael",
    lastName: "Rodriguez",
    email: "m.rodriguez@techflow.io",
    phone: "+1 (415) 555-1002",
    title: "CTO",
    companyIndex: 0,
    linkedinUrl: "https://linkedin.com/in/mrodriguez",
    source: "LinkedIn",
    tags: ["c-level", "technical", "decision-maker"],
  },
  {
    firstName: "Emily",
    lastName: "Thompson",
    email: "emily.t@datascale.com",
    phone: "+1 (212) 555-2001",
    title: "Director of Operations",
    companyIndex: 1,
    linkedinUrl: "https://linkedin.com/in/emilythompson",
    source: "Conference",
    tags: ["operations", "decision-maker"],
  },
  {
    firstName: "James",
    lastName: "Wilson",
    email: "jwilson@datascale.com",
    phone: "+1 (212) 555-2002",
    title: "CEO",
    companyIndex: 1,
    linkedinUrl: "https://linkedin.com/in/jameswilson",
    source: "Referral",
    tags: ["c-level", "decision-maker", "champion"],
  },
  {
    firstName: "Lisa",
    lastName: "Park",
    email: "lisa.park@cloudnine.dev",
    phone: "+1 (512) 555-3001",
    title: "Head of Product",
    companyIndex: 2,
    linkedinUrl: "https://linkedin.com/in/lisapark",
    source: "Cold Outreach",
    tags: ["product", "decision-maker"],
  },
  {
    firstName: "David",
    lastName: "Martinez",
    email: "david@secureguard.io",
    phone: "+1 (206) 555-4001",
    title: "CISO",
    companyIndex: 3,
    linkedinUrl: "https://linkedin.com/in/davidmartinez",
    source: "Webinar",
    tags: ["security", "c-level", "decision-maker"],
  },
  {
    firstName: "Amanda",
    lastName: "Foster",
    email: "afoster@secureguard.io",
    phone: "+1 (206) 555-4002",
    title: "Security Operations Manager",
    companyIndex: 3,
    linkedinUrl: "https://linkedin.com/in/amandafoster",
    source: "Inbound",
    tags: ["security", "champion"],
  },
  {
    firstName: "Robert",
    lastName: "Kim",
    email: "robert.kim@greenleaftech.com",
    phone: "+1 (503) 555-5001",
    title: "Founder & CEO",
    companyIndex: 4,
    linkedinUrl: "https://linkedin.com/in/robertkim",
    source: "Networking Event",
    tags: ["founder", "c-level", "decision-maker"],
  },
  {
    firstName: "Jennifer",
    lastName: "Adams",
    email: "jadams@healthsync.med",
    phone: "+1 (617) 555-6001",
    title: "VP of IT",
    companyIndex: 5,
    linkedinUrl: "https://linkedin.com/in/jenniferadams",
    source: "Trade Show",
    tags: ["healthcare", "decision-maker"],
  },
  {
    firstName: "Christopher",
    lastName: "Brown",
    email: "cbrown@healthsync.med",
    phone: "+1 (617) 555-6002",
    title: "Chief Medical Officer",
    companyIndex: 5,
    linkedinUrl: "https://linkedin.com/in/christopherbrown",
    source: "Referral",
    tags: ["healthcare", "c-level", "medical"],
  },
  {
    firstName: "Rachel",
    lastName: "Taylor",
    email: "rachel.taylor@finedge.co",
    phone: "+1 (212) 555-7001",
    title: "CFO",
    companyIndex: 6,
    linkedinUrl: "https://linkedin.com/in/racheltaylor",
    source: "LinkedIn",
    tags: ["fintech", "c-level", "decision-maker"],
  },
  {
    firstName: "Andrew",
    lastName: "Lee",
    email: "alee@finedge.co",
    phone: "+1 (212) 555-7002",
    title: "VP of Engineering",
    companyIndex: 6,
    linkedinUrl: "https://linkedin.com/in/andrewlee",
    source: "GitHub",
    tags: ["fintech", "technical", "decision-maker"],
  },
  {
    firstName: "Michelle",
    lastName: "Davis",
    email: "michelle.d@techflow.io",
    phone: "+1 (415) 555-1003",
    title: "Product Manager",
    companyIndex: 0,
    source: "Inbound",
    tags: ["product", "influencer"],
  },
  {
    firstName: "Daniel",
    lastName: "Garcia",
    email: "dgarcia@datascale.com",
    phone: "+1 (212) 555-2003",
    title: "Engineering Manager",
    companyIndex: 1,
    source: "Referral",
    tags: ["technical", "influencer"],
  },
  {
    firstName: "Stephanie",
    lastName: "Wright",
    email: "swright@cloudnine.dev",
    phone: "+1 (512) 555-3002",
    title: "DevOps Lead",
    companyIndex: 2,
    source: "Conference",
    tags: ["technical", "devops", "champion"],
  },
];

const DEALS = [
  {
    name: "TechFlow Enterprise License",
    companyIndex: 0,
    contactIndices: [0, 1],
    stageId: "negotiation",
    amount: 150000,
    probability: 75,
    expectedCloseDays: 14,
    status: "open" as const,
    tags: ["enterprise", "annual"],
  },
  {
    name: "DataScale Analytics Platform",
    companyIndex: 1,
    contactIndices: [2, 3],
    stageId: "proposal",
    amount: 280000,
    probability: 50,
    expectedCloseDays: 30,
    status: "open" as const,
    tags: ["enterprise", "multi-year"],
  },
  {
    name: "CloudNine DevOps Suite",
    companyIndex: 2,
    contactIndices: [4],
    stageId: "qualified",
    amount: 45000,
    probability: 25,
    expectedCloseDays: 45,
    status: "open" as const,
    tags: ["startup", "annual"],
  },
  {
    name: "SecureGuard Security Bundle",
    companyIndex: 3,
    contactIndices: [5, 6],
    stageId: "closed_won",
    amount: 200000,
    probability: 100,
    expectedCloseDays: -7,
    status: "won" as const,
    tags: ["enterprise", "security"],
  },
  {
    name: "GreenLeaf Sustainability Platform",
    companyIndex: 4,
    contactIndices: [7],
    stageId: "lead",
    amount: 65000,
    probability: 10,
    expectedCloseDays: 60,
    status: "open" as const,
    tags: ["startup", "cleantech"],
  },
  {
    name: "HealthSync Integration",
    companyIndex: 5,
    contactIndices: [8, 9],
    stageId: "negotiation",
    amount: 450000,
    probability: 80,
    expectedCloseDays: 10,
    status: "open" as const,
    tags: ["healthcare", "enterprise"],
  },
  {
    name: "FinEdge Payment Gateway",
    companyIndex: 6,
    contactIndices: [10, 11],
    stageId: "closed_lost",
    amount: 180000,
    probability: 0,
    expectedCloseDays: -14,
    status: "lost" as const,
    lostReason: "Went with competitor - pricing concerns",
    tags: ["fintech", "enterprise"],
  },
  {
    name: "TechFlow Professional Tier",
    companyIndex: 0,
    contactIndices: [12],
    stageId: "qualified",
    amount: 35000,
    probability: 30,
    expectedCloseDays: 21,
    status: "open" as const,
    tags: ["professional", "expansion"],
  },
];

const ACTIVITIES = [
  // Tasks
  {
    type: "task" as const,
    subject: "Send proposal follow-up email",
    description: "Follow up on the proposal sent last week. Address their questions about implementation timeline.",
    relatedToType: "deal" as const,
    dealIndex: 1,
    dueDate: now + days(2),
    completed: false,
    priority: "high" as const,
  },
  {
    type: "task" as const,
    subject: "Prepare pricing comparison",
    description: "Create a competitive analysis document for the negotiation meeting.",
    relatedToType: "deal" as const,
    dealIndex: 0,
    dueDate: now + days(1),
    completed: false,
    priority: "high" as const,
  },
  {
    type: "task" as const,
    subject: "Schedule technical demo",
    description: "Coordinate with engineering team to schedule a technical deep-dive demo.",
    relatedToType: "deal" as const,
    dealIndex: 2,
    dueDate: now + days(5),
    completed: false,
    priority: "medium" as const,
  },
  {
    type: "task" as const,
    subject: "Update contact information",
    description: "Verify and update contact details after recent company restructuring.",
    relatedToType: "contact" as const,
    contactIndex: 3,
    dueDate: now + days(3),
    completed: true,
    completedAt: now - hours(2),
    priority: "low" as const,
  },
  // Calls
  {
    type: "call" as const,
    subject: "Discovery call with Sarah Chen",
    description: "Initial discovery call to understand their workflow automation needs and current pain points. Discussed integration requirements with their existing tech stack.",
    relatedToType: "contact" as const,
    contactIndex: 0,
    duration: 45,
    outcome: "Positive - interested in enterprise tier. Follow up with proposal.",
  },
  {
    type: "call" as const,
    subject: "Contract review call",
    description: "Reviewed contract terms with legal team. Discussed SLA requirements and data handling provisions.",
    relatedToType: "deal" as const,
    dealIndex: 5,
    duration: 60,
    outcome: "Agreement on most terms. Minor redlines to address.",
  },
  {
    type: "call" as const,
    subject: "Quarterly check-in with SecureGuard",
    description: "Quarterly business review with SecureGuard team. Discussed expansion opportunities and renewal terms.",
    relatedToType: "company" as const,
    companyIndex: 3,
    duration: 30,
    outcome: "Happy customer. Potential for upsell to additional modules.",
  },
  // Emails
  {
    type: "email" as const,
    subject: "Re: Implementation Timeline",
    description: "Response to client questions about implementation timeline. Confirmed 6-week onboarding process and dedicated success manager assignment.",
    relatedToType: "deal" as const,
    dealIndex: 0,
    emailDirection: "outbound" as const,
  },
  {
    type: "email" as const,
    subject: "Introduction from James Wilson",
    description: "Warm introduction from James. Expressing interest in our analytics platform after seeing our presentation at TechCrunch Disrupt.",
    relatedToType: "contact" as const,
    contactIndex: 2,
    emailDirection: "inbound" as const,
  },
  {
    type: "email" as const,
    subject: "Pricing Request for Team Plan",
    description: "Incoming inquiry about team pricing and volume discounts for 50+ seats.",
    relatedToType: "company" as const,
    companyIndex: 2,
    emailDirection: "inbound" as const,
  },
  // Meetings
  {
    type: "meeting" as const,
    subject: "Executive presentation",
    description: "C-level presentation showcasing ROI analysis and case studies from similar healthcare implementations.",
    relatedToType: "deal" as const,
    dealIndex: 5,
    duration: 90,
    outcome: "Very positive reception. CFO requested detailed pricing breakdown.",
  },
  {
    type: "meeting" as const,
    subject: "Technical architecture review",
    description: "Deep dive into technical architecture, API documentation, and security certifications.",
    relatedToType: "deal" as const,
    dealIndex: 1,
    duration: 120,
    outcome: "Technical team satisfied. Moving forward with security review.",
  },
  // Notes
  {
    type: "note" as const,
    subject: "Competitor intelligence",
    description: "Learned that prospect is also evaluating Competitor X. They like our UI but concerned about pricing. Recommend emphasizing long-term TCO and support quality.",
    relatedToType: "deal" as const,
    dealIndex: 6,
  },
  {
    type: "note" as const,
    subject: "Key stakeholder map",
    description: "Decision makers: James Wilson (CEO) - final approver, Emily Thompson (Dir Ops) - champion and day-to-day contact, Daniel Garcia (Eng Manager) - technical evaluator.",
    relatedToType: "company" as const,
    companyIndex: 1,
  },
];

const CONVERSATIONS = [
  {
    phoneNumber: "+1 (415) 555-1001",
    contactIndex: 0,
    status: "active" as const,
    messages: [
      { direction: "outbound" as const, content: "Hi Sarah, this is Alex from Acme CRM. Just wanted to follow up on our call last week. Do you have time for a quick demo this Thursday?", statusMsg: "delivered" as const },
      { direction: "inbound" as const, content: "Hi Alex! Yes, Thursday works. Can we do 2pm PT?", statusMsg: "read" as const },
      { direction: "outbound" as const, content: "Perfect! I'll send over a calendar invite. Looking forward to it!", statusMsg: "delivered" as const },
    ],
  },
  {
    phoneNumber: "+1 (617) 555-6001",
    contactIndex: 8,
    status: "active" as const,
    messages: [
      { direction: "outbound" as const, content: "Hi Jennifer, following up on the contract we sent over. Let me know if you have any questions about the terms.", statusMsg: "delivered" as const },
      { direction: "inbound" as const, content: "Thanks! Our legal team is reviewing. Should have feedback by Friday.", statusMsg: "read" as const },
      { direction: "outbound" as const, content: "Sounds good. I'm available anytime if they need clarification on any points.", statusMsg: "sent" as const },
    ],
  },
  {
    phoneNumber: "+1 (212) 555-7001",
    contactIndex: 10,
    status: "archived" as const,
    messages: [
      { direction: "outbound" as const, content: "Hi Rachel, wanted to check in about your team's decision timeline.", statusMsg: "delivered" as const },
      { direction: "inbound" as const, content: "Hi, sorry for the late reply. We've decided to go with another vendor for now.", statusMsg: "read" as const },
      { direction: "outbound" as const, content: "I understand. Please keep us in mind for the future. Would love to reconnect next quarter.", statusMsg: "delivered" as const },
      { direction: "inbound" as const, content: "Will do. Thanks for understanding.", statusMsg: "read" as const },
    ],
  },
  {
    phoneNumber: "+1 (512) 555-3002",
    contactIndex: 14,
    status: "active" as const,
    messages: [
      { direction: "inbound" as const, content: "Hey, I saw your demo video on YouTube. Really impressed with the DevOps integrations!", statusMsg: "read" as const },
      { direction: "outbound" as const, content: "Thanks Stephanie! Would you like to see a personalized demo for CloudNine's setup?", statusMsg: "delivered" as const },
      { direction: "inbound" as const, content: "Definitely. Let me loop in Lisa from product too.", statusMsg: "read" as const },
    ],
  },
];

// ============================================================================
// SEED FUNCTIONS
// ============================================================================

/**
 * Seeds the default sales pipeline with standard stages
 */
export const seedPipeline = mutation({
  args: {},
  handler: async (ctx) => {
    // Check if default pipeline already exists
    const existingPipeline = await ctx.db
      .query("pipelines")
      .filter((q) => q.eq(q.field("isDefault"), true))
      .first();

    if (existingPipeline) {
      console.log("Default pipeline already exists, skipping...");
      return existingPipeline._id;
    }

    const pipelineId = await ctx.db.insert("pipelines", {
      name: "Sales Pipeline",
      description: "Default sales pipeline for tracking opportunities from lead to close.",
      stages: PIPELINE_STAGES,
      isDefault: true,
      createdAt: now,
      updatedAt: now,
    });

    console.log("Created default sales pipeline");
    return pipelineId;
  },
});

/**
 * Seeds sample companies
 */
export const seedCompanies = mutation({
  args: {},
  handler: async (ctx) => {
    const companyIds: Id<"companies">[] = [];

    for (const company of COMPANIES) {
      // Check if company already exists by domain
      const existing = await ctx.db
        .query("companies")
        .withIndex("by_domain", (q) => q.eq("domain", company.domain))
        .first();

      if (existing) {
        companyIds.push(existing._id);
        continue;
      }

      const companyId = await ctx.db.insert("companies", {
        name: company.name,
        domain: company.domain,
        industry: company.industry,
        size: company.size,
        annualRevenue: company.annualRevenue,
        description: company.description,
        address: company.address,
        phone: company.phone,
        website: company.website,
        tags: company.tags,
        createdAt: now - days(Math.floor(Math.random() * 90)),
        updatedAt: now,
      });
      companyIds.push(companyId);
    }

    console.log(`Created/found ${companyIds.length} companies`);
    return companyIds;
  },
});

/**
 * Seeds sample contacts (requires companies to be seeded first)
 */
export const seedContacts = mutation({
  args: { companyIds: v.array(v.id("companies")) },
  handler: async (ctx, args) => {
    const contactIds: Id<"contacts">[] = [];

    for (const contact of CONTACTS) {
      // Check if contact already exists by email
      const existing = await ctx.db
        .query("contacts")
        .withIndex("by_email", (q) => q.eq("email", contact.email))
        .first();

      if (existing) {
        contactIds.push(existing._id);
        continue;
      }

      const companyId = args.companyIds[contact.companyIndex];
      const createdAt = now - days(Math.floor(Math.random() * 60));

      const contactId = await ctx.db.insert("contacts", {
        firstName: contact.firstName,
        lastName: contact.lastName,
        email: contact.email,
        phone: contact.phone,
        title: contact.title,
        companyId: companyId,
        linkedinUrl: contact.linkedinUrl,
        source: contact.source,
        tags: contact.tags,
        createdAt: createdAt,
        updatedAt: now,
        lastActivityAt: now - hours(Math.floor(Math.random() * 72)),
      });
      contactIds.push(contactId);
    }

    console.log(`Created/found ${contactIds.length} contacts`);
    return contactIds;
  },
});

/**
 * Seeds sample deals (requires pipeline, companies, and contacts to be seeded first)
 */
export const seedDeals = mutation({
  args: {
    pipelineId: v.id("pipelines"),
    companyIds: v.array(v.id("companies")),
    contactIds: v.array(v.id("contacts")),
  },
  handler: async (ctx, args) => {
    const dealIds: Id<"deals">[] = [];

    for (const deal of DEALS) {
      const companyId = args.companyIds[deal.companyIndex];
      const contactIdsForDeal = deal.contactIndices.map(
        (idx) => args.contactIds[idx]
      );

      // Check if a similar deal already exists
      const existingDeals = await ctx.db
        .query("deals")
        .withIndex("by_company", (q) => q.eq("companyId", companyId))
        .collect();

      const existing = existingDeals.find((d) => d.name === deal.name);
      if (existing) {
        dealIds.push(existing._id);
        continue;
      }

      const createdAt = now - days(Math.floor(Math.random() * 30) + 7);
      const expectedCloseDate = now + days(deal.expectedCloseDays);

      const dealData: any = {
        name: deal.name,
        companyId: companyId,
        contactIds: contactIdsForDeal,
        pipelineId: args.pipelineId,
        stageId: deal.stageId,
        amount: deal.amount,
        currency: "USD",
        probability: deal.probability,
        expectedCloseDate: expectedCloseDate,
        status: deal.status,
        tags: deal.tags,
        createdAt: createdAt,
        updatedAt: now,
        stageChangedAt: now - days(Math.floor(Math.random() * 5)),
      };

      if (deal.status === "won" || deal.status === "lost") {
        dealData.actualCloseDate = now + days(deal.expectedCloseDays);
      }

      if (deal.lostReason) {
        dealData.lostReason = deal.lostReason;
      }

      const dealId = await ctx.db.insert("deals", dealData);
      dealIds.push(dealId);
    }

    console.log(`Created/found ${dealIds.length} deals`);
    return dealIds;
  },
});

/**
 * Seeds sample activities (requires contacts, companies, and deals to be seeded first)
 */
export const seedActivities = mutation({
  args: {
    companyIds: v.array(v.id("companies")),
    contactIds: v.array(v.id("contacts")),
    dealIds: v.array(v.id("deals")),
  },
  handler: async (ctx, args) => {
    const activityIds: Id<"activities">[] = [];

    for (const activity of ACTIVITIES) {
      let relatedToId: string;

      if (activity.relatedToType === "deal" && activity.dealIndex !== undefined) {
        relatedToId = args.dealIds[activity.dealIndex];
      } else if (activity.relatedToType === "contact" && activity.contactIndex !== undefined) {
        relatedToId = args.contactIds[activity.contactIndex];
      } else if (activity.relatedToType === "company" && activity.companyIndex !== undefined) {
        relatedToId = args.companyIds[activity.companyIndex];
      } else {
        continue;
      }

      const createdAt = now - hours(Math.floor(Math.random() * 168)); // Random time in last week

      const activityData: any = {
        type: activity.type,
        subject: activity.subject,
        description: activity.description,
        relatedToType: activity.relatedToType,
        relatedToId: relatedToId,
        createdAt: createdAt,
        updatedAt: now,
      };

      // Add type-specific fields
      if (activity.type === "task") {
        activityData.dueDate = activity.dueDate;
        activityData.completed = activity.completed;
        activityData.priority = activity.priority;
        if (activity.completedAt) {
          activityData.completedAt = activity.completedAt;
        }
      }

      if (activity.type === "call" || activity.type === "meeting") {
        activityData.duration = activity.duration;
        activityData.outcome = activity.outcome;
      }

      if (activity.type === "email") {
        activityData.emailDirection = activity.emailDirection;
      }

      const activityId = await ctx.db.insert("activities", activityData);
      activityIds.push(activityId);
    }

    console.log(`Created ${activityIds.length} activities`);
    return activityIds;
  },
});

/**
 * Seeds sample conversations with messages (requires contacts to be seeded first)
 */
export const seedConversations = mutation({
  args: { contactIds: v.array(v.id("contacts")) },
  handler: async (ctx, args) => {
    const conversationIds: Id<"conversations">[] = [];
    const sendblueNumber = "+1 (888) 555-0001";

    for (const conv of CONVERSATIONS) {
      const contactId = args.contactIds[conv.contactIndex];

      // Check if conversation already exists
      const existing = await ctx.db
        .query("conversations")
        .withIndex("by_phone", (q) => q.eq("phoneNumber", conv.phoneNumber))
        .first();

      if (existing) {
        conversationIds.push(existing._id);
        continue;
      }

      const createdAt = now - days(Math.floor(Math.random() * 14) + 1);
      const lastMessageContent = conv.messages[conv.messages.length - 1].content;

      const conversationId = await ctx.db.insert("conversations", {
        phoneNumber: conv.phoneNumber,
        sendblueNumber: sendblueNumber,
        contactId: contactId,
        status: conv.status,
        isIMessage: true,
        aiEnabled: false,
        messageCount: conv.messages.length,
        lastMessageAt: now - hours(Math.floor(Math.random() * 24)),
        lastMessagePreview: lastMessageContent.substring(0, 50) + (lastMessageContent.length > 50 ? "..." : ""),
        createdAt: createdAt,
      });

      // Add messages for this conversation
      for (let i = 0; i < conv.messages.length; i++) {
        const msg = conv.messages[i];
        const messageTimestamp = createdAt + hours(i * 2 + Math.random() * 2);

        await ctx.db.insert("messages", {
          conversationId: conversationId,
          direction: msg.direction,
          content: msg.content,
          status: msg.statusMsg,
          service: "iMessage",
          timestamp: messageTimestamp,
        });
      }

      conversationIds.push(conversationId);
    }

    console.log(`Created/found ${conversationIds.length} conversations with messages`);
    return conversationIds;
  },
});

/**
 * Seeds a sample user for development
 */
export const seedUser = mutation({
  args: {},
  handler: async (ctx) => {
    // Check if user already exists
    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", "demo@example.com"))
      .first();

    if (existingUser) {
      console.log("Demo user already exists");
      return existingUser._id;
    }

    const userId = await ctx.db.insert("users", {
      email: "demo@example.com",
      firstName: "Demo",
      lastName: "User",
      role: "admin",
      isActive: true,
      lastActiveAt: now,
      createdAt: now,
    });

    console.log("Created demo user");
    return userId;
  },
});

/**
 * Master seed function that seeds all data in the correct order
 * Call this from the Convex dashboard to seed all data at once
 */
export const seedAll = mutation({
  args: {},
  handler: async (ctx) => {
    console.log("Starting full database seed...");

    // 1. Create demo user
    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", "demo@example.com"))
      .first();

    let userId: Id<"users">;
    if (existingUser) {
      userId = existingUser._id;
      console.log("Demo user already exists");
    } else {
      userId = await ctx.db.insert("users", {
        email: "demo@example.com",
        firstName: "Demo",
        lastName: "User",
        role: "admin",
        isActive: true,
        lastActiveAt: now,
        createdAt: now,
      });
      console.log("Created demo user");
    }

    // 2. Create pipeline
    const existingPipeline = await ctx.db
      .query("pipelines")
      .filter((q) => q.eq(q.field("isDefault"), true))
      .first();

    let pipelineId: Id<"pipelines">;
    if (existingPipeline) {
      pipelineId = existingPipeline._id;
      console.log("Default pipeline already exists");
    } else {
      pipelineId = await ctx.db.insert("pipelines", {
        name: "Sales Pipeline",
        description: "Default sales pipeline for tracking opportunities from lead to close.",
        stages: PIPELINE_STAGES,
        isDefault: true,
        ownerId: userId,
        createdAt: now,
        updatedAt: now,
      });
      console.log("Created default sales pipeline");
    }

    // 3. Create companies
    const companyIds: Id<"companies">[] = [];
    for (const company of COMPANIES) {
      const existing = await ctx.db
        .query("companies")
        .withIndex("by_domain", (q) => q.eq("domain", company.domain))
        .first();

      if (existing) {
        companyIds.push(existing._id);
      } else {
        const companyId = await ctx.db.insert("companies", {
          name: company.name,
          domain: company.domain,
          industry: company.industry,
          size: company.size,
          annualRevenue: company.annualRevenue,
          description: company.description,
          address: company.address,
          phone: company.phone,
          website: company.website,
          tags: company.tags,
          ownerId: userId,
          createdAt: now - days(Math.floor(Math.random() * 90)),
          updatedAt: now,
        });
        companyIds.push(companyId);
      }
    }
    console.log(`Created/found ${companyIds.length} companies`);

    // 4. Create contacts
    const contactIds: Id<"contacts">[] = [];
    for (const contact of CONTACTS) {
      const existing = await ctx.db
        .query("contacts")
        .withIndex("by_email", (q) => q.eq("email", contact.email))
        .first();

      if (existing) {
        contactIds.push(existing._id);
      } else {
        const companyId = companyIds[contact.companyIndex];
        const createdAt = now - days(Math.floor(Math.random() * 60));

        const contactId = await ctx.db.insert("contacts", {
          firstName: contact.firstName,
          lastName: contact.lastName,
          email: contact.email,
          phone: contact.phone,
          title: contact.title,
          companyId: companyId,
          linkedinUrl: contact.linkedinUrl,
          source: contact.source,
          tags: contact.tags,
          ownerId: userId,
          createdAt: createdAt,
          updatedAt: now,
          lastActivityAt: now - hours(Math.floor(Math.random() * 72)),
        });
        contactIds.push(contactId);
      }
    }
    console.log(`Created/found ${contactIds.length} contacts`);

    // 5. Create deals
    const dealIds: Id<"deals">[] = [];
    for (const deal of DEALS) {
      const companyId = companyIds[deal.companyIndex];
      const contactIdsForDeal = deal.contactIndices.map((idx) => contactIds[idx]);

      const existingDeals = await ctx.db
        .query("deals")
        .withIndex("by_company", (q) => q.eq("companyId", companyId))
        .collect();

      const existing = existingDeals.find((d) => d.name === deal.name);
      if (existing) {
        dealIds.push(existing._id);
      } else {
        const createdAt = now - days(Math.floor(Math.random() * 30) + 7);
        const expectedCloseDate = now + days(deal.expectedCloseDays);

        const dealData: any = {
          name: deal.name,
          companyId: companyId,
          contactIds: contactIdsForDeal,
          pipelineId: pipelineId,
          stageId: deal.stageId,
          amount: deal.amount,
          currency: "USD",
          probability: deal.probability,
          expectedCloseDate: expectedCloseDate,
          status: deal.status,
          tags: deal.tags,
          ownerId: userId,
          createdAt: createdAt,
          updatedAt: now,
          stageChangedAt: now - days(Math.floor(Math.random() * 5)),
        };

        if (deal.status === "won" || deal.status === "lost") {
          dealData.actualCloseDate = now + days(deal.expectedCloseDays);
        }

        if (deal.lostReason) {
          dealData.lostReason = deal.lostReason;
        }

        const dealId = await ctx.db.insert("deals", dealData);
        dealIds.push(dealId);
      }
    }
    console.log(`Created/found ${dealIds.length} deals`);

    // 6. Create activities
    const activityIds: Id<"activities">[] = [];
    for (const activity of ACTIVITIES) {
      let relatedToId: string;

      if (activity.relatedToType === "deal" && activity.dealIndex !== undefined) {
        relatedToId = dealIds[activity.dealIndex];
      } else if (activity.relatedToType === "contact" && activity.contactIndex !== undefined) {
        relatedToId = contactIds[activity.contactIndex];
      } else if (activity.relatedToType === "company" && activity.companyIndex !== undefined) {
        relatedToId = companyIds[activity.companyIndex];
      } else {
        continue;
      }

      const createdAt = now - hours(Math.floor(Math.random() * 168));

      const activityData: any = {
        type: activity.type,
        subject: activity.subject,
        description: activity.description,
        relatedToType: activity.relatedToType,
        relatedToId: relatedToId,
        ownerId: userId,
        createdAt: createdAt,
        updatedAt: now,
      };

      if (activity.type === "task") {
        activityData.dueDate = activity.dueDate;
        activityData.completed = activity.completed;
        activityData.priority = activity.priority;
        if (activity.completedAt) {
          activityData.completedAt = activity.completedAt;
        }
      }

      if (activity.type === "call" || activity.type === "meeting") {
        activityData.duration = activity.duration;
        activityData.outcome = activity.outcome;
      }

      if (activity.type === "email") {
        activityData.emailDirection = activity.emailDirection;
      }

      const activityId = await ctx.db.insert("activities", activityData);
      activityIds.push(activityId);
    }
    console.log(`Created ${activityIds.length} activities`);

    // 7. Create conversations with messages
    const conversationIds: Id<"conversations">[] = [];
    const sendblueNumber = "+1 (888) 555-0001";

    for (const conv of CONVERSATIONS) {
      const contactId = contactIds[conv.contactIndex];

      const existing = await ctx.db
        .query("conversations")
        .withIndex("by_phone", (q) => q.eq("phoneNumber", conv.phoneNumber))
        .first();

      if (existing) {
        conversationIds.push(existing._id);
        continue;
      }

      const createdAt = now - days(Math.floor(Math.random() * 14) + 1);
      const lastMessageContent = conv.messages[conv.messages.length - 1].content;

      const conversationId = await ctx.db.insert("conversations", {
        phoneNumber: conv.phoneNumber,
        sendblueNumber: sendblueNumber,
        contactId: contactId,
        status: conv.status,
        isIMessage: true,
        aiEnabled: false,
        messageCount: conv.messages.length,
        lastMessageAt: now - hours(Math.floor(Math.random() * 24)),
        lastMessagePreview: lastMessageContent.substring(0, 50) + (lastMessageContent.length > 50 ? "..." : ""),
        ownerId: userId,
        createdAt: createdAt,
      });

      for (let i = 0; i < conv.messages.length; i++) {
        const msg = conv.messages[i];
        const messageTimestamp = createdAt + hours(i * 2 + Math.random() * 2);

        await ctx.db.insert("messages", {
          conversationId: conversationId,
          direction: msg.direction,
          content: msg.content,
          status: msg.statusMsg,
          service: "iMessage",
          timestamp: messageTimestamp,
        });
      }

      conversationIds.push(conversationId);
    }
    console.log(`Created/found ${conversationIds.length} conversations with messages`);

    console.log("Database seed complete!");

    return {
      userId,
      pipelineId,
      companyCount: companyIds.length,
      contactCount: contactIds.length,
      dealCount: dealIds.length,
      activityCount: activityIds.length,
      conversationCount: conversationIds.length,
    };
  },
});

/**
 * Clears all seeded data from the database
 * WARNING: This will delete all data from all tables!
 */
export const clearAllData = mutation({
  args: { confirm: v.literal("DELETE_ALL_DATA") },
  handler: async (ctx, args) => {
    if (args.confirm !== "DELETE_ALL_DATA") {
      throw new Error("Must confirm deletion by passing 'DELETE_ALL_DATA'");
    }

    // Delete in reverse order of dependencies
    const messages = await ctx.db.query("messages").collect();
    for (const msg of messages) {
      await ctx.db.delete(msg._id);
    }

    const conversations = await ctx.db.query("conversations").collect();
    for (const conv of conversations) {
      await ctx.db.delete(conv._id);
    }

    const activities = await ctx.db.query("activities").collect();
    for (const activity of activities) {
      await ctx.db.delete(activity._id);
    }

    const deals = await ctx.db.query("deals").collect();
    for (const deal of deals) {
      await ctx.db.delete(deal._id);
    }

    const contacts = await ctx.db.query("contacts").collect();
    for (const contact of contacts) {
      await ctx.db.delete(contact._id);
    }

    const companies = await ctx.db.query("companies").collect();
    for (const company of companies) {
      await ctx.db.delete(company._id);
    }

    const pipelines = await ctx.db.query("pipelines").collect();
    for (const pipeline of pipelines) {
      await ctx.db.delete(pipeline._id);
    }

    const users = await ctx.db.query("users").collect();
    for (const user of users) {
      await ctx.db.delete(user._id);
    }

    console.log("All data cleared");
    return { success: true };
  },
});
