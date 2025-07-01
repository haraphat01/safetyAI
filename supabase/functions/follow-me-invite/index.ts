// Setup type definitions for built-in Supabase Runtime APIs
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

if (!RESEND_API_KEY) {
  throw new Error('RESEND_API_KEY environment variable is required');
}

if (!SUPABASE_URL) {
  throw new Error('SUPABASE_URL environment variable is required');
}

if (!SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('SUPABASE_SERVICE_ROLE_KEY environment variable is required');
}

interface FollowMeInviteRequest {
  participant_id: string;
  session_id: string;
  contact_id: string;
  invited_by: string;
}

Deno.serve(async (req) => {
  try {
    console.log('Follow Me invite function called');
    
    const { participant_id, session_id, contact_id, invited_by } = await req.json() as FollowMeInviteRequest;
    
    console.log('Request data:', { participant_id, session_id, contact_id, invited_by });
    
    if (!participant_id || !session_id || !contact_id || !invited_by) {
      console.error('Missing required fields');
      return new Response(JSON.stringify({
        error: "Missing required fields: participant_id, session_id, contact_id, invited_by"
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Fetch session details
    console.log('Fetching session details...');
    const { data: session, error: sessionError } = await supabase
      .from('follow_me_sessions')
      .select('*')
      .eq('id', session_id)
      .single();

    if (sessionError || !session) {
      console.error('Session not found:', sessionError);
      return new Response(JSON.stringify({
        error: "Session not found"
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    console.log('Session found:', session.session_name);

    // Fetch contact details
    console.log('Fetching contact details...');
    const { data: contact, error: contactError } = await supabase
      .from('emergency_contacts')
      .select('*')
      .eq('id', contact_id)
      .single();

    if (contactError || !contact) {
      console.error('Contact not found:', contactError);
      return new Response(JSON.stringify({
        error: "Contact not found"
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    console.log('Contact found:', contact.name, contact.email);

    // Check if contact has email
    if (!contact.email) {
      console.error('Contact does not have email address');
      return new Response(JSON.stringify({
        error: "Contact does not have an email address"
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Fetch inviter details
    console.log('Fetching inviter details...');
    let inviterName = 'User';
    try {
      const { data: inviterData } = await supabase.auth.admin.getUserById(invited_by);
      if (inviterData && inviterData.user && inviterData.user.user_metadata && inviterData.user.user_metadata.full_name) {
        inviterName = inviterData.user.user_metadata.full_name;
      } else {
        const { data: profileData } = await supabase.from('users').select('full_name').eq('id', invited_by).single();
        if (profileData && profileData.full_name) {
          inviterName = profileData.full_name;
        }
      }
    } catch (error) {
      console.warn('Could not fetch inviter details, using default name:', error);
    }

    console.log('Inviter name:', inviterName);

    // Create a unique invite link (you can customize this based on your app's URL structure)
    const inviteLink = `https://your-app-domain.com/follow-me/join?session=${session_id}&participant=${participant_id}`;
    
    // Create a Google Maps link for the session start location (if available)
    const mapsLink = session.location && session.location.latitude && session.location.longitude ? 
      `https://www.google.com/maps?q=${session.location.latitude},${session.location.longitude}` : 
      null;

    console.log('Maps link:', mapsLink);

    // Prepare email content
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 28px;">📍 Follow Me Invitation</h1>
          <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 16px;">Join ${inviterName}'s journey in real-time</p>
        </div>
        
        <div style="background: white; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
          <h2 style="color: #333; margin-top: 0;">Hello ${contact.name}!</h2>
          
          <p style="font-size: 16px; line-height: 1.6;">
            <strong>${inviterName}</strong> has invited you to join their live location tracking session and would like you to follow their journey in real-time.
          </p>
          
          <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #667eea;">
            <h3 style="margin-top: 0; color: #333;">Session Details:</h3>
            <p style="margin: 5px 0;"><strong>Session Name:</strong> ${session.session_name}</p>
            ${session.description ? `<p style="margin: 5px 0;"><strong>Description:</strong> ${session.description}</p>` : ''}
            <p style="margin: 5px 0;"><strong>Started:</strong> ${new Date(session.started_at).toLocaleString()}</p>
            ${mapsLink ? `<p style="margin: 5px 0;"><strong>Start Location:</strong> <a href="${mapsLink}" style="color: #667eea;">View on Google Maps</a></p>` : ''}
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${inviteLink}" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 25px; font-weight: bold; font-size: 16px; display: inline-block;">
              🚀 Join the Journey
            </a>
          </div>
          
          <div style="background: #e8f4fd; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <h4 style="margin-top: 0; color: #2c5aa0;">What you'll see:</h4>
            <ul style="margin: 5px 0; padding-left: 20px;">
              <li>Real-time location updates</li>
              <li>Current speed and direction</li>
              <li>Address information</li>
              <li>Session status and duration</li>
            </ul>
          </div>
          
          <p style="font-size: 14px; color: #666; margin-top: 30px;">
            <strong>Privacy Note:</strong> This invitation is sent only to you as an emergency contact. 
            You can leave the session at any time, and your access will be automatically revoked when the session ends.
          </p>
          
          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
          
          <p style="font-size: 12px; color: #999; text-align: center;">
            This invitation was sent from the SafetyAI app. 
            If you didn't expect this invitation, please contact ${inviterName} directly.
          </p>
        </div>
      </div>
    `;

    // Send email using Resend API
    console.log('Sending email via Resend API...');
    console.log('Email to:', contact.email);
    console.log('Email subject:', `📍 ${inviterName} invited you to follow their journey - ${session.session_name}`);
    
    const emailPayload = {
      from: 'SafetyAI <no-reply@safe9ja.com>',
      to: contact.email,
      subject: `📍 ${inviterName} invited you to follow their journey - ${session.session_name}`,
      html: html
    };

    console.log('Email payload:', JSON.stringify(emailPayload, null, 2));

    const emailResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`
      },
      body: JSON.stringify(emailPayload)
    });

    console.log('Resend API response status:', emailResponse.status);
    console.log('Resend API response headers:', Object.fromEntries(emailResponse.headers.entries()));

    const emailResult = await emailResponse.json();
    console.log('Resend API response body:', emailResult);

    if (!emailResponse.ok) {
      console.error('Email sending failed:', emailResult);
      console.error('Response status:', emailResponse.status);
      console.error('Response headers:', Object.fromEntries(emailResponse.headers.entries()));
      return new Response(JSON.stringify({
        error: "Failed to send email",
        details: emailResult,
        status: emailResponse.status
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    console.log('Email sent successfully:', emailResult);

    // Update participant status to indicate invite was sent
    console.log('Updating participant status...');
    const { error: updateError } = await supabase
      .from('follow_me_participants')
      .update({ 
        status: 'invited',
        updated_at: new Date().toISOString()
      })
      .eq('id', participant_id);

    if (updateError) {
      console.error('Failed to update participant status:', updateError);
    } else {
      console.log('Participant status updated successfully');
    }

    console.log('Follow Me invite function completed successfully');

    return new Response(JSON.stringify({
      success: true,
      message: `Invitation sent to ${contact.name} (${contact.email})`,
      emailResult: emailResult
    }), {
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Follow Me invite function error:', error);
    return new Response(JSON.stringify({
      error: "Internal server error",
      details: error.message,
      stack: error.stack
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}); 