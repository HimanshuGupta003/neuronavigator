import { NextRequest, NextResponse } from 'next/server';
import twilio from 'twilio';

// Type definitions for request body
interface SOSRequestBody {
    latitude: number | null;
    longitude: number | null;
    coachName: string;
    coachEmail: string;
}

export async function POST(request: NextRequest) {
    try {
        // Parse request body
        const body: SOSRequestBody = await request.json();
        const { latitude, longitude, coachName, coachEmail } = body;

        // Validate environment variables
        const accountSid = process.env.TWILIO_ACCOUNT_SID;
        const authToken = process.env.TWILIO_AUTH_TOKEN;
        const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;
        const emergencyContact1 = process.env.EMERGENCY_CONTACT_1;
        const emergencyContact2 = process.env.EMERGENCY_CONTACT_2;

        if (!accountSid || !authToken || !twilioPhoneNumber) {
            console.error('Missing Twilio credentials in environment variables');
            return NextResponse.json(
                { success: false, error: 'Server configuration error - Twilio credentials missing' },
                { status: 500 }
            );
        }

        // Create Twilio client
        const client = twilio(accountSid, authToken);

        // Build location link
        let locationLink = 'Location not available';
        if (latitude && longitude) {
            locationLink = `https://maps.google.com/?q=${latitude},${longitude}`;
        }

        // Build emergency message
        const timestamp = new Date().toLocaleString('en-US', {
            timeZone: 'America/Los_Angeles',
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });

        const emergencyMessage = `🚨 EMERGENCY ALERT - CoachAlly

Coach: ${coachName || 'Unknown'}
Email: ${coachEmail || 'Unknown'}
Time: ${timestamp}

Location: ${locationLink}

Please respond immediately!`;

        // Collect verified phone numbers to send to
        const phoneNumbers: string[] = [];
        if (emergencyContact1) phoneNumbers.push(emergencyContact1);
        if (emergencyContact2) phoneNumbers.push(emergencyContact2);

        if (phoneNumbers.length === 0) {
            return NextResponse.json(
                { success: false, error: 'No emergency contacts configured' },
                { status: 500 }
            );
        }

        // Send SMS to all verified numbers
        const sendResults = await Promise.allSettled(
            phoneNumbers.map(async (toNumber) => {
                const message = await client.messages.create({
                    body: emergencyMessage,
                    from: twilioPhoneNumber,
                    to: toNumber,
                });
                console.log(`SOS SMS sent to ${toNumber}, SID: ${message.sid}`);
                return { phoneNumber: toNumber, messageId: message.sid, status: message.status };
            })
        );

        // Check if at least one message was sent successfully
        const successfulSends = sendResults.filter(
            (result) => result.status === 'fulfilled'
        );

        const failedSends = sendResults.filter(
            (result) => result.status === 'rejected'
        ) as PromiseRejectedResult[];

        if (successfulSends.length === 0) {
            const errorDetails = failedSends.map(r => r.reason?.message || 'Unknown error').join('; ');
            console.error('All SMS sends failed. Errors:', errorDetails);
            return NextResponse.json(
                { success: false, error: `Failed to send SMS: ${errorDetails}` },
                { status: 500 }
            );
        }

        // Log successful sends
        console.log('SOS Alert sent successfully:', {
            coachName,
            coachEmail,
            latitude,
            longitude,
            timestamp,
            messagesCount: successfulSends.length,
        });

        return NextResponse.json({
            success: true,
            message: 'Emergency alert sent successfully',
            sentTo: successfulSends.length,
        });

    } catch (error) {
        console.error('SOS API Error:', error);
        
        // Check if it's a Twilio error
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
        { error: 'Method not allowed. Use POST.' },
        { status: 405 }
    );
}
