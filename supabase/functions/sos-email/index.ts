// Setup type definitions for built-in Supabase Runtime APIs
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
// ... (imports and setup remain the same)
Deno.serve(async (req)=>{
  const { userId, location, battery, audioUrl, networkInfo } = await req.json();
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  const { data: contacts, error } = await supabase.from("emergency_contacts").select("email").eq("user_id", userId);
  if (error || !contacts || contacts.length === 0) {
    return new Response(JSON.stringify({
      error: "No contacts found or DB error"
    }), {
      status: 400
    });
  }
  // Fetch sender's name
  let senderName = 'User';
  const { data: userData } = await supabase.auth.admin.getUserById(userId);
  if (userData && userData.user && userData.user.user_metadata && userData.user.user_metadata.full_name) {
    senderName = userData.user.user_metadata.full_name;
  } else {
    const { data: profileData } = await supabase.from('profiles').select('full_name').eq('id', userId).single();
    if (profileData && profileData.full_name) {
      senderName = profileData.full_name;
    }
  }
  // Prepare address and Google Maps link
  const address = location.formattedAddress || location.address || "Unknown address";
  const mapsUrl = `https://www.google.com/maps?q=${location.latitude},${location.longitude}`;
  // Prepare email content
  const html = `
    <div style="font-family: Arial, sans-serif; color: #222;">
      <h2 style="color: #b30000;">🚨 DANGER! SOS Alert from ${senderName}</h2>
      <p><b>This person may be in immediate danger. Please act quickly!</b></p>
      <ul>
        <li><b>Name:</b> ${senderName}</li>
        <li><b>Address:</b> ${address}</li>
        <li><b>Coordinates:</b> ${location.latitude}, ${location.longitude}</li>
        <li><b>Google Maps:</b> <a href="${mapsUrl}">${mapsUrl}</a></li>
        <li><b>Battery:</b> ${battery ?? 'Unknown'}%</li>
        <li><b>Network:</b> ${networkInfo?.type ?? 'Unknown'} (${networkInfo?.isConnected ? 'Connected' : 'Disconnected'})</li>
      </ul>
      <p><b>Audio recording from the last minute is attached.</b></p>
      <p style="color: #b30000;"><b>If you cannot reach ${senderName}, contact emergency services immediately!</b></p>
    </div>
  `;
  // Prepare attachment if audioUrl is present
  let attachments: Array<{ filename: string; content: string; type: string; encoding: string }> = [];
  if (audioUrl) {
    try {
      // Extract the file path after the bucket name
      // Example: https://<project>.supabase.co/storage/v1/object/public/sos-audio/sos-audio-<userId>-<timestamp>.m4a
      const match = audioUrl.match(/sos-audio\/(.+)$/);
      if (match && match[1]) {
        const filePath = match[1];
        const { data: audioData, error: audioError } = await supabase.storage.from('sos-audio').download(filePath);
        if (!audioError && audioData) {
          // Read the stream and convert to base64
          const buffer = await audioData.arrayBuffer();
          const base64 = btoa(String.fromCharCode(...new Uint8Array(buffer)));
          attachments = [
            {
              filename: filePath.split('/').pop() || 'sos-audio.m4a',
              content: base64,
              type: "audio/m4a",
              encoding: "base64"
            }
          ];
        }
      }
    } catch (e) {
      // If audio fetch fails, continue without attachment
    }
  }
  // Send email to each contact using Resend API
  const results = [];
  for (const contact of contacts){
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${RESEND_API_KEY}`
      },
      body: JSON.stringify({
        from: 'no-reply@safe9ja.com',
        to: contact.email,
        subject: `🚨 DANGER! SOS Alert from ${senderName} - Immediate Help Needed`,
        html,
        attachments
      })
    });
    results.push(await res.json());
  }
  return new Response(JSON.stringify({
    success: true,
    results
  }), {
    headers: {
      'Content-Type': 'application/json'
    }
  });
});
