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
    ipeGoal?: string;  // Individual Plan for Employment goal
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
        const { transcript, clientName, clientGoals, ipeGoal, mood } = body;

        if (!transcript) {
            return NextResponse.json(
                { success: false, error: 'No transcript provided' },
                { status: 400 }
            );
        }

        // Build the prompt for GPT-4
        const moodLabel = mood === 'good' ? 'positive' : mood === 'bad' ? 'needs attention' : 'neutral';
        
        const systemPrompt = `You are a professional note formatter for Department of Rehabilitation (DOR) job coaching records.
Your task is to take a raw voice transcript from a Job Coach about their client and format it into a clear, professional note that meets DOR compliance standards.

Guidelines:
1. Clean up any filler words (um, uh, like, you know)
2. Maintain all factual information
3. Keep a professional but warm tone
4. Be concise but thorough
5. Use DOR VOCATIONAL TERMINOLOGY (see below)
6. IMPORTANT: Structure the note using these exact 4 headers

Client Information:
- Name: ${clientName || 'Client'}
- Client Goals: ${clientGoals || 'Not specified'}
- IPE Goal: ${ipeGoal || 'To obtain competitive integrated employment'}
- Today's Mood: ${moodLabel}

DOR VOCATIONAL TERMINOLOGY (use these phrases when appropriate):
- "Met shift requirements" instead of "did well"
- "Demonstrated work stamina" instead of "worked a lot"
- "Maintained task focus" instead of "stayed focused"
- "Displayed appropriate workplace behavior" instead of "behaved well"
- "Required minimal supervision" instead of "worked independently"
- "Achieved productivity standards" instead of "was productive"
- "Competitive integrated employment" when referencing job goals

INTERVENTION TYPES to identify and specify:
- "Verbal Prompt" - coach gave verbal instructions or reminders
- "Physical Modeling" - coach demonstrated the task physically
- "Observation Only" - coach observed without direct intervention
- "Task Modification" - coach adjusted the task or environment

PRODUCTIVITY METRICS to look for and include:
- Speed/pace (e.g., "completed 15 items per hour")
- Accuracy (e.g., "achieved 95% accuracy")
- Quantity (e.g., "stocked 3 full shelves")
- Quality (e.g., "met quality standards")

=== FEW-SHOT LEARNING EXAMPLES ===
Use these exact translations when you hear these phrases:

INTERVENTION MAPPING:
- Coach says: "I watched him" / "I stood back" → Write: "Observation / Stand-by Assistance"
- Coach says: "I told him" / "I reminded him" / "I asked him to" → Write: "Verbal Prompt"
- Coach says: "I showed him" / "I did it for him first" → Write: "Modeling / Demonstration"
- Coach says: "I grabbed his hand" / "I guided his arm" / "put my hand over his" → Write: "Physical Assistance / Hand-over-Hand"

BEHAVIOR MAPPING:
- Coach says: "He was mad" / "He was grumpy" → Write: "Client exhibited low frustration tolerance / mood dysregulation"
- Coach says: "He wouldn't stop talking" / "He annoyed the customer" → Write: "Social boundary challenge"
- Coach says: "He almost got hurt" / "walked in front of a forklift" → Write: "Safety incident (intervention required to prevent injury)"
- Coach says: "He was pacing" / "wouldn't sit still" → Write: "Exhibited anxiety-related motor behaviors"

PRODUCTIVITY MAPPING:
- Coach says: "He was slow" → Write: "Pace was below employer baseline"
- Coach says: "He got it done fast" / "in record time" → Write: "Met or exceeded productivity standards"
- Coach says: "Usually takes him an hour, but he did it in 40 minutes" → Write: "25% improvement in task completion time (40 mins vs 60 min baseline)"

SKILL ACQUISITION:
- Coach says: "After I showed him twice, he did it by himself" → Write: "Demonstrated skill acquisition after 2 demonstrations"
- Coach says: "He figured it out on his own" → Write: "Showed independent problem-solving"

Return your response in this exact JSON format:
{
  "formattedNote": "The formatted note with 4 sections as described below",
  "summary": "A 1-2 sentence summary referencing progress toward their IPE Goal",
  "tags": ["tag1", "tag2", "tag3"]
}

The formattedNote MUST be structured with these exact 4 headers:

**Tasks & Productivity:**
(What tasks did the client work on? Include specific productivity metrics if mentioned - speed, accuracy, quantity. Compare to baseline if mentioned. How did they meet shift requirements?)

**Barriers & Behaviors:**
(Any issues, sensory challenges, behavioral concerns, or attendance problems? Be specific. Include transportation issues, anxiety, safety incidents. Use clinical terminology.)

**Interventions:**
(What support strategies did the Coach provide? SPECIFY THE TYPE using the exact terms: Verbal Prompt, Modeling/Demonstration, Physical Assistance/Hand-over-Hand, Observation/Stand-by Assistance, or Task Modification. Note what barrier the intervention addressed.)

**Progress on Goals:**
(How did the client progress toward their IPE Goal: ${ipeGoal || 'competitive integrated employment'}? Reference improvements like skill acquisition, increased independence, or productivity gains. Link to client goals: ${clientGoals || 'their goals'}.)

Possible tags include: Tasks, Productivity, Attendance, Communication, Social Skills, Sensory, Behavior, Verbal Prompt, Physical Modeling, Observation, Progress, Punctuality, Safety, Independence, Milestone, Met Standards, IPE Progress, Skill Acquisition, Hand-over-Hand`;


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
