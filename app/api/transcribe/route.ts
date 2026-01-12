import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

// Initialize OpenAI client
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
    try {
        // Check for API key
        if (!process.env.OPENAI_API_KEY) {
            return NextResponse.json(
                { success: false, error: 'OpenAI API key not configured' },
                { status: 500 }
            );
        }

        // Get the audio file from form data
        const formData = await request.formData();
        const audioFile = formData.get('audio') as File;

        if (!audioFile) {
            return NextResponse.json(
                { success: false, error: 'No audio file provided' },
                { status: 400 }
            );
        }

        // Validate file type
        const validTypes = ['audio/webm', 'audio/mp3', 'audio/wav', 'audio/m4a', 'audio/mpeg'];
        if (!validTypes.some(type => audioFile.type.includes(type.split('/')[1]))) {
            return NextResponse.json(
                { success: false, error: 'Invalid audio format. Supported: webm, mp3, wav, m4a' },
                { status: 400 }
            );
        }

        // Convert File to the format OpenAI expects
        const transcription = await openai.audio.transcriptions.create({
            file: audioFile,
            model: 'whisper-1',
            language: 'en',
            response_format: 'text',
        });

        return NextResponse.json({
            success: true,
            transcript: transcription,
        });

    } catch (error) {
        console.error('Transcription error:', error);
        
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
        { error: 'Method not allowed. Use POST with audio file.' },
        { status: 405 }
    );
}
