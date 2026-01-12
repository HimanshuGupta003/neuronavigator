import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import twilio from 'twilio';

// Use service role for public access (no user auth)
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
    try {
        // Get token and location from request
        const { token, latitude, longitude } = await request.json();

        if (!token) {
            return NextResponse.json(
                { success: false, error: 'Token is required' },
                { status: 400 }
            );
        }

        // Verify token is valid and not revoked
        const { data: tokenData, error: tokenError } = await supabase
            .from('client_safety_tokens')
            .select(`
                *,
                clients!inner(
                    id,
                    full_name,
                    coach_id,
                    emergency_contact_name,
                    emergency_contact_phone
                )
            `)
            .eq('token', token)
            .is('revoked_at', null)
            .single();

        if (tokenError || !tokenData) {
            return NextResponse.json(
                { success: false, error: 'Invalid or expired safety link' },
                { status: 401 }
            );
        }

        const client = tokenData.clients;
        
        // Get coach info for the message
        const { data: coach } = await supabase
            .from('profiles')
            .select('full_name, email')
            .eq('id', client.coach_id)
            .single();

        // Build location link
        let locationText = 'Location not available';
        if (latitude && longitude) {
            locationText = `https://maps.google.com/maps?q=${latitude},${longitude}`;
        }

        // Build emergency message
        const message = `🚨 SOS ALERT - CLIENT EMERGENCY 🚨

Client: ${client.full_name}
Coach: ${coach?.full_name || 'Unknown'}
Time: ${new Date().toLocaleString()}

Location: ${locationText}

This alert was triggered via the client's safety app. Please respond immediately.`;

        // Collect all phone numbers to notify
        const phoneNumbers: string[] = [];
        
        // Add emergency contacts from env
        if (process.env.EMERGENCY_CONTACT_1) {
            phoneNumbers.push(process.env.EMERGENCY_CONTACT_1);
        }
        if (process.env.EMERGENCY_CONTACT_2) {
            phoneNumbers.push(process.env.EMERGENCY_CONTACT_2);
        }
        
        // Add client's emergency contact if available
        if (client.emergency_contact_phone) {
            phoneNumbers.push(client.emergency_contact_phone);
        }

        // Send SMS via Twilio
        if (phoneNumbers.length > 0 && process.env.TWILIO_ACCOUNT_SID) {
            const twilioClient = twilio(
                process.env.TWILIO_ACCOUNT_SID,
                process.env.TWILIO_AUTH_TOKEN
            );

            const sendPromises = phoneNumbers.map(phone =>
                twilioClient.messages.create({
                    body: message,
                    from: process.env.TWILIO_PHONE_NUMBER,
                    to: phone,
                }).catch(err => {
                    console.error(`Failed to send to ${phone}:`, err);
                    return null;
                })
            );

            await Promise.all(sendPromises);
        }

        // Log the emergency
        await supabase.from('emergency_logs').insert({
            coach_id: client.coach_id,
            latitude: latitude || null,
            longitude: longitude || null,
            message_sent: message,
            twilio_message_sid: 'client_sos_trigger',
        });

        return NextResponse.json({
            success: true,
            message: 'Emergency alert sent successfully',
            clientName: client.full_name,
        });

    } catch (error) {
        console.error('Client SOS error:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to send emergency alert' },
            { status: 500 }
        );
    }
}
