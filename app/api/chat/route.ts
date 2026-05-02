import { Groq } from 'groq-sdk';
import { NextRequest, NextResponse } from 'next/server';

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const { messages } = await request.json();

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: 'Messages array is required' },
        { status: 400 }
      );
    }

    if (!process.env.GROQ_API_KEY) {
      return NextResponse.json(
        { error: 'GROQ_API_KEY is not configured' },
        { status: 500 }
      );
    }

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

    console.log('Chat request received with', messages.length, 'messages');

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
    console.error('Chat API error:', error);
    
    // Return a helpful error message
    const errorMessage = error instanceof Error ? error.message : 'Failed to process chat request';
    
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
