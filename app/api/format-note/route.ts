import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

// Initialize OpenAI client
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

interface FormatNoteRequest {
    transcript: string;
    clientName: string;
    clientGoals: string;
    mood: 'good' | 'neutral' | 'bad';
}

export async function POST(request: NextRequest) {
    try {
        // Check for API key
        if (!process.env.OPENAI_API_KEY) {
            return NextResponse.json(
                { success: false, error: 'OpenAI API key not configured' },
                { status: 500 }
            );
        }

        // Parse request body
        const body: FormatNoteRequest = await request.json();
        const { transcript, clientName, clientGoals, mood } = body;

        if (!transcript) {
            return NextResponse.json(
                { success: false, error: 'No transcript provided' },
                { status: 400 }
            );
        }

        // Build the prompt for GPT-4
        const moodLabel = mood === 'good' ? 'positive' : mood === 'bad' ? 'needs attention' : 'neutral';
        
        const systemPrompt = `You are a professional note formatter for Department of Rehabilitation (DOR) job coaching records.
Your task is to take a raw voice transcript from a Job Coach about their client and format it into a clear, professional note.

Guidelines:
1. Clean up any filler words (um, uh, like, you know)
2. Maintain all factual information
3. Keep a professional but warm tone
4. Be concise but thorough
5. IMPORTANT: Structure the note using these exact 4 headers

Client Information:
- Name: ${clientName || 'Client'}
- Goals: ${clientGoals || 'Not specified'}
- Today's Mood: ${moodLabel}

Return your response in this exact JSON format:
{
  "formattedNote": "The formatted note with 4 sections as described below",
  "summary": "A 1-2 sentence summary of the session",
  "tags": ["tag1", "tag2", "tag3"]
}

The formattedNote MUST be structured with these exact 4 headers:

**Tasks & Productivity:**
(What tasks did the client work on? How productive were they?)

**Barriers & Behaviors:**
(Any issues, sensory challenges, behavioral concerns, or attendance problems?)

**Interventions:**
(What support or strategies did the Coach provide to help?)

**Progress on Goals:**
(How did the client progress toward their stated goals: ${clientGoals || 'their goals'}?)

Possible tags include: Tasks, Productivity, Attendance, Communication, Social Skills, Sensory, Behavior, Intervention, Progress, Punctuality, Safety, Independence, Milestone`;


        const completion = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: `Please format this coaching note: "${transcript}"` }
            ],
            temperature: 0.7,
            max_tokens: 1000,
            response_format: { type: 'json_object' },
        });

        const content = completion.choices[0]?.message?.content;
        
        if (!content) {
            return NextResponse.json(
                { success: false, error: 'No response from AI' },
                { status: 500 }
            );
        }

        // Parse the JSON response
        const formatted = JSON.parse(content);

        return NextResponse.json({
            success: true,
            formattedNote: formatted.formattedNote,
            summary: formatted.summary,
            tags: formatted.tags || [],
        });

    } catch (error) {
        console.error('Format note error:', error);
        
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        
        return NextResponse.json(
            { success: false, error: errorMessage },
            { status: 500 }
        );
    }
}

// Handle other methods
export async function GET() {
    return NextResponse.json(
        { error: 'Method not allowed. Use POST with transcript.' },
        { status: 405 }
    );
}
