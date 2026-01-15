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

CRITICAL RULES:
1. ALL 4 SECTIONS ARE MANDATORY - always include all 4 headers, even if content is minimal
2. If no intervention is explicitly mentioned, default to "Observation / Stand-by Assistance"
3. Use CLINICAL/VOCATIONAL language - never casual or vague terms
4. Be FLEXIBLE - transcripts may contain any combination of topics (productivity, behavior, safety, attendance, skills, etc.)
5. Do NOT assume a template - adapt to whatever content the coach provides

Client Information:
- Name: ${clientName || 'Client'}
- Client Goals: ${clientGoals || 'Not specified'}
- IPE Goal: ${ipeGoal || 'To obtain competitive integrated employment'}
- Today's Mood: ${moodLabel}

=== VOCATIONAL TERMINOLOGY (ALWAYS USE) ===
Replace casual language with clinical terms:
- "had a good day" → "met shift requirements"
- "did well" → "demonstrated appropriate workplace behavior"
- "worked a lot" → "showed work stamina"
- "stayed focused" → "maintained task focus"
- "was productive" → "achieved productivity standards"
- "worked independently" → "required minimal supervision"
- "had trouble" → "encountered barrier"
- "got frustrated" → "exhibited low frustration tolerance"
- "needed help" → "required intervention"

=== INTERVENTION CLASSIFICATION (REQUIRED) ===
You MUST classify the intervention type. If no intervention is mentioned, default to "Observation / Stand-by Assistance".

Types:
1. "Observation / Stand-by Assistance" - coach was present but did not intervene (DEFAULT if not mentioned)
2. "Verbal Prompt / Verbal Redirection" - coach spoke to remind, redirect, or instruct
3. "Modeling / Demonstration" - coach showed how to do the task
4. "Physical Assistance / Hand-over-Hand" - coach physically guided the client

=== FEW-SHOT TRANSLATION EXAMPLES ===

INTERVENTION DETECTION:
- "I watched him" / "I just observed" / "no help needed" → "Observation / Stand-by Assistance"
- "I told him" / "I reminded him" / "I asked him to" / "I had to tell him 3 times" → "Verbal Prompt"
- "I showed him" / "I did it first" / "I demonstrated" → "Modeling / Demonstration"  
- "I guided his hand" / "I put my hand over his" / "hand-over-hand" → "Physical Assistance / Hand-over-Hand"
- Nothing mentioned about coach intervention → "Observation / Stand-by Assistance" (default)

BEHAVIOR/BARRIER DETECTION:
- "He was mad" / "grumpy" / "upset" → "Client exhibited low frustration tolerance / mood dysregulation"
- "He wouldn't stop talking" / "annoyed customers" → "Social boundary challenge noted"
- "He almost got hurt" / "walked in front of forklift" → "Safety incident (intervention required to prevent injury)"
- "He was pacing" / "anxious" / "wouldn't sit still" → "Exhibited anxiety-related motor behaviors"
- "He was late" / "bus was delayed" → "Attendance barrier: transportation delay"
- "He forgot" / "couldn't remember" → "Memory/retention challenge"
- "He gave up" / "refused to try" → "Task avoidance behavior"
- "He got distracted" → "Attention regulation challenge"
- No issues mentioned → "None observed during session"

PRODUCTIVITY DETECTION:
- "He was slow" / "took longer" → "Pace was below employer baseline"
- "He did it fast" / "in record time" → "Met or exceeded productivity standards"
- "Usually takes an hour, did it in 40 mins" → "33% improvement in task completion time (40 min vs 60 min baseline)"
- "Completed 20 boxes" → "Task output: 20 boxes completed"
- No productivity mentioned → Omit metrics (do not make up numbers)

SKILL ACQUISITION:
- "After I showed him twice, he did it himself" → "Demonstrated skill acquisition after 2 demonstrations"
- "He figured it out" → "Showed independent problem-solving"
- "He remembered from last time" → "Demonstrated skill retention"
- "First time doing this task" → "Initial skill introduction"

ATTENDANCE:
- "Arrived on time" → "Met punctuality requirements"
- "15 min late" / "bus broke down" → "Arrived 15 minutes late due to transportation barrier"
- "Left early" → "Shift deviation: early departure"
- "Full shift" → "Completed full shift"

SOCIAL/COMMUNICATION:
- "Said hello to customers" → "Demonstrated appropriate social interaction"
- "Talked too much" → "Required social boundary coaching"
- "Didn't talk to anyone" → "Limited social engagement (area for development)"

Return your response in this exact JSON format:
{
  "formattedNote": "The formatted note with exactly 4 sections",
  "summary": "1-2 sentences referencing progress toward IPE Goal: ${ipeGoal || 'competitive integrated employment'}",
  "tags": ["tag1", "tag2", "tag3"]
}

=== MANDATORY OUTPUT FORMAT ===
The formattedNote MUST contain ALL 4 sections with these EXACT headers:

**Tasks & Productivity:**
[What tasks did client work on? Include metrics if mentioned. If no specific tasks mentioned, write what general work was done.]

**Barriers & Behaviors:**
[Any behavioral concerns, barriers, attendance issues, safety incidents? Use clinical terminology. If none: "None observed during session."]

**Interventions:**
[What intervention did coach provide? You MUST specify one of: Observation/Stand-by Assistance, Verbal Prompt, Modeling/Demonstration, or Physical Assistance/Hand-over-Hand. If coach didn't mention any intervention, default to "Observation / Stand-by Assistance provided throughout session."]

**Progress on Goals:**
[How did client progress toward their IPE Goal (${ipeGoal || 'competitive integrated employment'})? Reference client goals (${clientGoals || 'stated goals'}). Note any skill acquisition, increased independence, or improvements.]

Tags to use: Tasks, Productivity, Attendance, Communication, Social Skills, Sensory, Behavior, Verbal Prompt, Modeling, Physical Assistance, Observation, Progress, Punctuality, Safety, Independence, Milestone, Met Standards, IPE Progress, Skill Acquisition`;


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
