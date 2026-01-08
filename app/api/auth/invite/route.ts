import { NextRequest, NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { Resend } from 'resend';
import crypto from 'crypto';

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient();
        const adminClient = await createAdminClient();

        // Verify the user is authenticated and is an admin
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json(
                { success: false, error: 'Unauthorized' },
                { status: 401 }
            );
        }

        // Check if user is admin
        const { data: profile } = await adminClient
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single();

        if (profile?.role !== 'admin') {
            return NextResponse.json(
                { success: false, error: 'Only administrators can invite workers' },
                { status: 403 }
            );
        }

        const { email } = await request.json();

        if (!email) {
            return NextResponse.json(
                { success: false, error: 'Email is required' },
                { status: 400 }
            );
        }

        // Check if user already exists
        const { data: existingProfile } = await adminClient
            .from('profiles')
            .select('id')
            .eq('email', email)
            .single();

        if (existingProfile) {
            return NextResponse.json(
                { success: false, error: 'A user with this email already exists' },
                { status: 400 }
            );
        }

        // Check for existing pending invitation
        const { data: existingInvitation } = await adminClient
            .from('invitations')
            .select('id')
            .eq('email', email)
            .is('used_at', null)
            .gt('expires_at', new Date().toISOString())
            .single();

        if (existingInvitation) {
            return NextResponse.json(
                { success: false, error: 'A pending invitation already exists for this email' },
                { status: 400 }
            );
        }

        // Generate secure token
        const token = crypto.randomBytes(32).toString('hex');

        // Set expiration to 7 days from now
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7);

        // Create invitation record
        const { error: insertError } = await adminClient
            .from('invitations')
            .insert({
                email,
                token,
                invited_by: user.id,
                expires_at: expiresAt.toISOString(),
            });

        if (insertError) {
            console.error('Insert error:', insertError);
            return NextResponse.json(
                { success: false, error: 'Failed to create invitation' },
                { status: 500 }
            );
        }

        // Generate invitation link
        const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
        const invitationLink = `${appUrl}/setup-credentials?token=${token}`;

        // Send email via Resend
        let emailSent = false;
        if (resend) {
            try {
                await resend.emails.send({
                    from: 'NeuroNavigator <onboarding@resend.dev>',
                    to: email,
                    subject: 'You\'ve been invited to NeuroNavigator',
                    html: `
            <!DOCTYPE html>
            <html>
              <head>
                <meta charset="utf-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
              </head>
              <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f3f4f6; margin: 0; padding: 40px 20px;">
                <div style="max-width: 480px; margin: 0 auto;">
                  <!-- Header -->
                  <div style="text-align: center; margin-bottom: 32px;">
                    <div style="display: inline-block; width: 56px; height: 56px; background: linear-gradient(135deg, #6366f1, #8b5cf6); border-radius: 14px; margin-bottom: 16px;"></div>
                    <h1 style="margin: 0; font-size: 24px; font-weight: 700; color: #111827;">NeuroNavigator</h1>
                    <p style="margin: 4px 0 0 0; font-size: 14px; color: #6b7280;">AI-Powered Field Reporting</p>
                  </div>
                  
                  <!-- Card -->
                  <div style="background: #ffffff; border-radius: 16px; padding: 32px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
                    <h2 style="margin: 0 0 8px 0; font-size: 20px; font-weight: 600; color: #111827;">You're Invited!</h2>
                    <p style="margin: 0 0 24px 0; font-size: 15px; color: #6b7280; line-height: 1.6;">
                      You've been invited to join NeuroNavigator as a field worker. Click the button below to set up your account and get started.
                    </p>
                    
                    <a href="${invitationLink}" style="display: block; text-align: center; background: #6366f1; color: #ffffff; padding: 14px 24px; border-radius: 10px; text-decoration: none; font-weight: 600; font-size: 15px;">
                      Set Up Your Account
                    </a>
                    
                    <p style="margin: 24px 0 0 0; font-size: 13px; color: #9ca3af; text-align: center;">
                      This invitation expires in 7 days.
                    </p>
                  </div>
                  
                  <!-- Footer -->
                  <p style="margin: 24px 0 0 0; font-size: 12px; color: #9ca3af; text-align: center;">
                    If you didn't expect this invitation, you can ignore this email.
                  </p>
                </div>
              </body>
            </html>
          `,
                });
                emailSent = true;
            } catch (emailError) {
                console.error('Failed to send email:', emailError);
                // Continue without email - admin can share link manually
            }
        }

        return NextResponse.json({
            success: true,
            data: {
                invitationLink,
                emailSent,
                message: emailSent
                    ? 'Invitation email sent successfully!'
                    : 'Invitation created. Please share the link manually (email sending not configured).'
            },
        });

    } catch (error) {
        console.error('Invite error:', error);
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        );
    }
}
