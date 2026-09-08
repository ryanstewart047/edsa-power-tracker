# AI Chatbot Integration Guide

## Overview
The EDSA Power Tracker application now includes an AI-powered chatbot powered by the **Groq API**. The chatbot provides instant assistance to users about power status, hazard reporting, and general inquiries.

## Setup Instructions

### 1. Get a Groq API Key
1. Visit [console.groq.com](https://console.groq.com)
2. Sign up for a free account
3. Navigate to the API Keys section
4. Generate a new API key
5. Copy the API key

### 2. Configure Environment Variables
Add your Groq API key to your `.env.local` file:

```bash
GROQ_API_KEY=your-groq-api-key-here
```

**Important:** Never commit your API key to version control. Keep it in `.env.local` only.

### 3. Install Dependencies
The Groq SDK has already been installed via `npm install groq-sdk`. No additional setup is needed.

### 4. Test the Chatbot Locally
Run the development server:

```bash
npm run dev
```

Navigate to any page of the application, and you should see a blue chat button (💬) in the bottom-right corner.

## Architecture

### Files Created

#### 1. **API Route** (`/app/api/chat/route.ts`)
- Handles incoming chat requests
- Communicates with Groq API
- Uses active Groq production models with automated fallback (`openai/gpt-oss-120b`, `openai/gpt-oss-20b`, `qwen/qwen3.8-27b`, `qwen/qwen3.6-27b`, `groq/compound`)
- Configuration: max_tokens: 1024, temperature: 0.7

#### 2. **ChatBot Component** (`/components/ChatBot.tsx`)
- React client component with interactive UI
- Features:
  - Floating chat button that expands when clicked
  - Message history display
  - Auto-scroll to latest messages
  - Loading indicator while waiting for AI response
  - Keyboard support (Enter to send)
  - Responsive design (works on mobile and desktop)
- Uses Lucide React icons for UI elements

#### 3. **Layout Integration** (`/app/layout.tsx`)
- Added `<ChatBot />` component to the root layout
- Ensures chatbot is available on all pages

## Features

### User-Facing Features
- 💬 Floating chat widget in the bottom-right corner
- Real-time message streaming
- Conversation history maintained during session
- Timestamps on each message
- Loading indicator while processing requests
- Mobile-responsive design

### AI Capabilities
- Uses Groq's active production models with automated fallback
- Maintains conversation context
- Handles multi-turn conversations
- Error handling with automatic fallback to next available model

## Model Selection

The chatbot utilizes Groq's production models in an automated fallback hierarchy:
1. **Primary Flagship Model**: `openai/gpt-oss-120b` (Ultra-fast 120B reasoning model)
2. **Fast Utility Model**: `openai/gpt-oss-20b` (Fast, efficient utility model)
3. **Fallback Models**:
   - `qwen/qwen3.8-27b`
   - `qwen/qwen3.6-27b`
   - `groq/compound`

If a model is unavailable or encounters an error, the system automatically falls back to the next model in line.
You can optionally set `GROQ_MODEL` in `.env.local` to prioritize a specific model.

## Customization

### Customize the System Prompt
To make the chatbot more focused (e.g., only answer EDSA-related questions), modify the API route:

```typescript
const completion = await groq.chat.completions.create({
  messages: [
    {
      role: 'system',
      content: 'You are a helpful assistant for EDSA Power Tracker. Answer questions about power outages, hazard reporting, and platform features. For unrelated questions, politely redirect the user.',
    },
    ...messages.map((msg: any) => ({
      role: msg.role,
      content: msg.content,
    })),
  ],
  // ... rest of config
});
```

### Customize the UI
Edit the ChatBot component (`/components/ChatBot.tsx`) to:
- Change colors (modify `bg-blue-600` classes)
- Adjust size (modify `w-96` for width, `max-h-[32rem]` for height)
- Change the initial greeting message
- Add new features (typing indicators, user avatars, etc.)

## Limitations & Considerations

1. **Rate Limiting**: Groq's free tier has rate limits. Monitor usage in the console.
2. **Context Length**: The Mixtral model has a 32k token context window.
3. **Cost**: Free tier is sufficient for small to medium traffic. Monitor usage.
4. **Data Privacy**: Conversations are not stored by default. Consider adding database logging if needed.

## Deployment

### Production Deployment (Vercel/Others)
1. Add `GROQ_API_KEY` to your hosting platform's environment variables
2. Ensure the API route is deployed
3. Test the chatbot on the live site

### Security Checklist
- ✅ API key stored in `.env.local` (not committed)
- ✅ Environment variable configured on production
- ✅ API route validates input before sending to Groq
- ✅ Error messages don't expose sensitive information

## Monitoring & Analytics

To track chatbot usage, consider:
1. Logging messages to the database (add Prisma model)
2. Tracking API call errors and latency
3. Monitoring Groq API quota in the Groq console

## Troubleshooting

### Chatbot not appearing
- Check that `GROQ_API_KEY` is set in `.env.local`
- Ensure you ran `npm install groq-sdk`
- Check browser console for errors

### Chat not responding
- Verify `GROQ_API_KEY` is valid in the Groq console
- Check API call quota hasn't been exceeded
- Look at server logs for error messages

### Error: "GROQ_API_KEY is not configured"
- Add `GROQ_API_KEY=your-key` to `.env.local`
- Restart the development server

## Next Steps

1. Add system prompts to specialize the chatbot
2. Store conversation history in the database
3. Add user authentication to the chatbot
4. Implement feedback/rating system for responses
5. Add multilingual support (useful for Sierra Leone context)

---

**Integration Date**: May 2, 2026  
**Framework**: Next.js 14 + React 18  
**AI Provider**: Groq (Free API)
