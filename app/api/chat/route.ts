import { Groq } from 'groq-sdk';
import { NextRequest, NextResponse } from 'next/server';

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

    // Build messages with system prompt
    const systemPrompt = `You are a helpful AI assistant for EDSA Power Tracker - a professional platform for electricity status reporting and hazard escalation in Freetown, Sierra Leone.

Your role:
- Help users understand how to use EDSA (tracking power status, reporting hazards, managing operations)
- Provide clear, actionable guidance
- Answer questions about electricity, power outages, and safety
- Be professional and supportive

Keep responses concise and helpful.`;

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
      model: 'mixtral-8x7b-32768',
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
