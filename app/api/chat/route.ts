import { Groq } from 'groq-sdk';
import { NextRequest, NextResponse } from 'next/server';
import { searchWeb, formatSearchResultsForAI } from '@/lib/webSearch';

/**
 * Strips markdown symbols (**bold**, ## headings, stray asterisks) into clean plain text
 */
function cleanPlainText(text: string): string {
  if (!text) return '';
  return text
    // Remove markdown headers: #, ##, ### at start of lines
    .replace(/^#{1,6}\s+/gm, '')
    // Remove bold/italic markdown asterisks: **bold** -> bold, *italic* -> italic
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/\*(.*?)\*/g, '$1')
    // Remove standalone decorative asterisks
    .replace(/\*/g, '')
    // Convert markdown bullet dashes/asterisks into clean dots
    .replace(/^[-*]\s+/gm, '• ')
    .trim();
}

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

About the Developer:
Ryan Josiah Stewart is a Full Stack Developer, System Administrator, and Cloud Solutions Architect passionate about creating innovative web solutions and providing expert IT services. He specializes in building scalable applications with modern technologies and delivering exceptional user experiences.
- Portfolio: https://www.itservicesfreetown.com/ryanjstewart
- Company: BridgeTech IT Services

About You (The AI Assistant):
Your role:
- Help users understand how to use EDSA (tracking power status, reporting hazards, managing operations)
- Provide clear, actionable guidance
- Answer questions about electricity, power outages, and safety
- For current information (weather, news, prices, etc.), search the web for latest data
- If asked about Ryan Josiah Stewart, mention his expertise in Full Stack Development, System Administration, Cloud Solutions Architecture, and his passion for innovative web solutions
- When sharing the portfolio URL, do not add trailing punctuation characters
- Be professional and supportive

Strict Text Formatting Rules:
- Write in 100% natural, clean plain text only.
- Do NOT use markdown symbols: NEVER use asterisks for bold or italic (**word** or *word*), NEVER use hashes for titles (## or ###), and do NOT use decorative slashes (/).
- Use simple plain paragraphs, clean line breaks, or regular numbers (1., 2., 3.) for steps.
- Keep responses concise, friendly, and easy to read on mobile phone screens.

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

    // Groq Active Production Models:
    // Primary: openai/gpt-oss-120b
    // Fast Utility: openai/gpt-oss-20b
    // Fallbacks: qwen/qwen3.8-27b, qwen/qwen3.6-27b, groq/compound
    const modelsToTry = Array.from(
      new Set(
        [
          process.env.GROQ_MODEL,
          'openai/gpt-oss-120b',
          'openai/gpt-oss-20b',
          'qwen/qwen3.8-27b',
          'qwen/qwen3.6-27b',
          'groq/compound',
        ].filter((m): m is string => Boolean(m && m.trim()))
      )
    );

    console.log('Sending request to Groq API with', messages.length, 'user messages');

    let completion = null;
    let successfulModel = '';
    let lastError: unknown = null;

    for (const model of modelsToTry) {
      try {
        console.log(`Attempting Groq completion with model: ${model}`);
        completion = await groq.chat.completions.create({
          messages: allMessages,
          model,
          max_tokens: 1024,
          temperature: 0.7,
          top_p: 1,
          stream: false,
        });
        successfulModel = model;
        console.log(`Chat response successfully generated with model: ${model}`);
        break;
      } catch (err) {
        lastError = err;
        console.warn(`Groq model '${model}' failed:`, err instanceof Error ? err.message : err);
      }
    }

    if (!completion) {
      throw lastError || new Error('All Groq model attempts failed.');
    }

    const rawAssistantMessage =
      completion.choices[0]?.message?.content || 'I encountered an issue generating a response. Please try again.';

    const assistantMessage = cleanPlainText(rawAssistantMessage);

    return NextResponse.json({
      message: assistantMessage,
      model: successfulModel,
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
