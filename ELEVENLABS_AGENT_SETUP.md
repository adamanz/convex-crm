# ElevenLabs CRM Agent Setup Guide

## Overview

This repository includes a fully configured **CRM Assistant** agent powered by ElevenLabs ConvAI. The agent can:

- 🔍 **Search** contacts, companies, and deals by name, email, location, etc.
- ✨ **Create** new contacts, companies, and deals with voice commands
- 📊 Manage your sales pipeline through natural conversation
- 🎤 Fully integrated with the Convex CRM platform

## Prerequisites

1. **ElevenLabs Account** with API access
2. **ElevenLabs CLI** installed globally:
   ```bash
   npm install -g @elevenlabs/cli
   ```
3. **Proper API Key Permissions** (see below)

## Step 1: Create API Key with Proper Permissions

1. Go to **https://elevenlabs.io/app/settings/api-keys**
2. Click **"Create new API key"**
3. Enter a name (e.g., "CRM Agent")
4. Select these permissions:
   - ✅ `convai_read` - Read conversational AI data
   - ✅ `convai_write` - Create and update conversational AI agents
   - ✅ `projects_read` - Read project data
   - ✅ `projects_write` - Modify project data
5. Click **Create**
6. Copy the API key (you won't be able to see it again)

## Step 2: Set Up Environment

```bash
# Set the API key as an environment variable
export ELEVENLABS_API_KEY='your-api-key-here'

# Verify authentication
elevenlabs auth whoami
```

You should see:
```
✓ Authentication Status
Logged in to ElevenLabs
  · Residency: global
```

## Step 3: Deploy the Agent

```bash
# Navigate to the project directory
cd /path/to/convex-crm

# Push the agent configuration to ElevenLabs
elevenlabs agents push

# Push the tools configuration to ElevenLabs
elevenlabs tools push

# Optional: Push tests
elevenlabs tests push
```

After pushing, you should see output like:
```
✓ Successfully pushed agents
  · CRM Assistant (agent_id: xxxxxxx)

✓ Successfully pushed tools
  · search-contacts
  · search-companies
  · search-deals
  · create-contact
  · create-company
  · create-deal
```

## Step 4: Get Your Agent ID

After deployment, copy the agent ID from the output. It will look like: `xxxxxxx`

## Step 5: Configure the CRM Application

1. Add the agent ID to your `.env.local`:
   ```bash
   NEXT_PUBLIC_ELEVENLABS_AGENT_ID=your-agent-id-here
   ```

2. Add to Vercel environment variables:
   ```
   NEXT_PUBLIC_ELEVENLABS_AGENT_ID=your-agent-id-here
   ```

3. Deploy to Vercel:
   ```bash
   vercel --prod --yes
   ```

## Agent Features

### Search Tools

The agent can search for:

- **Contacts**: Search by name, email, phone, or company
  ```
  "Search for all contacts at Acme Corp"
  "Find John Smith's contact information"
  ```

- **Companies**: Search by name, industry, or location
  ```
  "Show me companies in San Francisco"
  "Find technology companies we work with"
  ```

- **Deals**: Search by name, stage, or owner
  ```
  "What deals are in negotiation stage?"
  "Show me deals owned by Sarah"
  ```

### Create Tools

The agent can create new records:

- **Contacts**: Requires at least last name
  ```
  "Create a new contact: John Smith, john@acme.com, Sales Manager"
  ```

- **Companies**: Requires at least company name
  ```
  "Add a new company called TechFlow Inc, based in New York"
  ```

- **Deals**: Requires at least deal name
  ```
  "Create a new deal called Enterprise Migration for $250,000"
  ```

## Testing the Agent

### Via CLI

```bash
# Run a test conversation with the agent
elevenlabs agents test "CRM Assistant"
```

### Via ElevenLabs Dashboard

1. Go to https://elevenlabs.io/app/agents
2. Find "CRM Assistant"
3. Click to open the agent
4. Use the conversation interface to test

### Via Your CRM Application

1. Go to your deployed CRM (https://convex-4iupm5lr3-adam-5554s-projects.vercel.app)
2. Look for the ElevenLabs widget in the bottom-right corner (blue circle with microphone)
3. Click to start speaking with the agent

## API Endpoints Required

The agent tools expect these endpoints to exist on your CRM backend:

```
POST /api/convex/search/contacts
POST /api/convex/search/companies
POST /api/convex/search/deals
POST /api/convex/create/contact
POST /api/convex/create/company
POST /api/convex/create/deal
```

These endpoints should integrate with your Convex backend to perform the actual operations.

## Troubleshooting

### "Missing permissions" error

**Solution**: Your API key doesn't have `convai_write` permission. Create a new key with proper permissions.

### Agent not responding

**Solution**: Check that:
1. Agent ID is correctly set in `.env.local`
2. Environment variables are deployed to Vercel
3. Agent is deployed to ElevenLabs (`elevenlabs agents push`)

### Tools not working

**Solution**: Ensure:
1. Tools are pushed (`elevenlabs tools push`)
2. Your CRM API endpoints are implemented and returning proper response schemas
3. `BASE_URL` is correctly configured in tool endpoints

## Next Steps

1. ✅ Deploy agent to ElevenLabs
2. ✅ Configure agent ID in CRM
3. ⏳ Implement backend API endpoints for search and create operations
4. ⏳ Test agent with voice commands
5. ⏳ Customize agent instructions and tools as needed

## Support

For more information:
- [ElevenLabs Documentation](https://elevenlabs.io/docs)
- [ElevenLabs CLI Docs](https://github.com/elevenlabs/elevenlabs-cli)
- [ConvAI Widget Docs](https://elevenlabs.io/docs/integrations/convai-widget)

---

**Created:** 2025-12-28
**Agent Version:** 1.0
**Status:** Configuration Ready for Deployment
