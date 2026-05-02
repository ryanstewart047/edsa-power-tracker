import { Groq } from 'groq-sdk';
import { NextRequest, NextResponse } from 'next/server';
import { searchWeb, formatSearchResultsForAI } from '@/lib/webSearch';

/**
 * Determine if a query should trigger a web search
 */
function shouldSearchWeb(query: string): boolean {
  const searchTriggers = [
    'what',
    'who',
    'when',
    'where',
    'how',
    'latest',
    'recent',
    'current',
    'today',
    'news',
    'find',
    'search',
    'tell me',
    'information',
    'explain',
    'define',
    'weather',
    'price',
    'cost',
  ];
  
  const lowerQuery = query.toLowerCase();
  return searchTriggers.some(trigger => lowerQuery.includes(trigger));
}

export async function POST(request: NextRequest) {
  try {
    const { messages } = await request.json();

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: 'Messages array is required' },
        { status: 400 }
      );
    }

    // Check for API key
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      console.error('GROQ_API_KEY is not set in environment variables');
      return NextResponse.json(
        { error: 'API configuration error. GROQ_API_KEY is missing.' },
        { status: 500 }
      );
    }

    console.log('Creating Groq client...');
    // Initialize Groq client only at runtime, not at build time
    const groq = new Groq({
      apiKey: apiKey,
    });

    // Get the last user message for context
    const lastUserMessage = messages
      .slice()
      .reverse()
      .find((msg: { role: string; content: string }) => msg.role === 'user')
      ?.content || '';

    // Determine if web search is needed and attempt it
    let webSearchInfo = '';
    if (shouldSearchWeb(lastUserMessage)) {
      try {
        console.log('Attempting web search for:', lastUserMessage);
        const results = await Promise.race([
          searchWeb(lastUserMessage, 3),
          new Promise<never[]>((_, reject) =>
            setTimeout(() => reject(new Error('Search timeout')), 4000)
          ),
        ]);
        
        if (results && results.length > 0) {
          webSearchInfo = formatSearchResultsForAI(results);
          console.log('Web search successful, found', results.length, 'results');
        }
      } catch (searchError) {
        console.warn('Web search failed (continuing without web data):', searchError);
        // Continue without web search - don't break the chat
      }
    }

    // Build messages with system prompt
    let systemPrompt = `You are a helpful AI assistant for EDSA Power Tracker - a professional platform for electricity status reporting and hazard escalation in Freetown, Sierra Leone.

Your role:
- Help users understand how to use EDSA (tracking power status, reporting hazards, managing operations)
- Provide clear, actionable guidance
- Answer questions about electricity, power outages, and safety
- For current information (weather, news, prices, etc.), search the web for latest data
- Be professional and supportive

Keep responses concise and helpful.

Important: When asked about current events, latest information, or real-time data, you have the ability to search the web for the most current information.`;

    if (webSearchInfo) {
      systemPrompt += `\n\nRecent Web Search Results:\n${webSearchInfo}\n\nUse the above search results to provide current and accurate information.`;
    }

    const allMessages = [
      {
        role: 'system' as const,
        content: systemPrompt,
      },
      ...messages.map((msg: { role: string; content: string }) => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content,
      })),
    ];

    console.log('Sending request to Groq API with', messages.length, 'user messages');

    const completion = await groq.chat.completions.create({
      messages: allMessages,
      model: 'llama-3.3-70b-versatile',
      max_tokens: 1024,
      temperature: 0.7,
      top_p: 1,
      stream: false,
    });

    const assistantMessage =
      completion.choices[0]?.message?.content || 'I encountered an issue generating a response. Please try again.';

    console.log('Chat response generated successfully');

    return NextResponse.json({
      message: assistantMessage,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('Chat API error:', errorMessage);
    console.error('Full error:', error);
    
    return NextResponse.json(
      { error: `Server error: ${errorMessage}` },
      { status: 500 }
    );
  }
}
