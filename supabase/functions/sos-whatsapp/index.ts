// Setup type definitions for built-in Supabase Runtime APIs
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const WHATSAPP_API_TOKEN = Deno.env.get('WHATSAPP_API_TOKEN');
const WHATSAPP_PHONE_NUMBER_ID = Deno.env.get('WHATSAPP_PHONE_NUMBER_ID');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

Deno.serve(async (req) => {
  try {
    const { userId, location, battery, audioUrl, networkInfo } = await req.json();

    if (!WHATSAPP_API_TOKEN || !WHATSAPP_PHONE_NUMBER_ID) {
      return new Response(JSON.stringify({
        error: "WhatsApp API not configured"
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

    // Get emergency contacts with WhatsApp numbers
    const { data: contacts, error } = await supabase
      .from("emergency_contacts")
      .select("name, whatsapp")
      .eq("user_id", userId)
      .not("whatsapp", "is", null);

    if (error || !contacts || contacts.length === 0) {
      return new Response(JSON.stringify({
        error: "No WhatsApp contacts found or DB error"
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
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

    // Prepare WhatsApp message
    const message = `🚨 *DANGER! SOS Alert from ${senderName}*

*This person may be in immediate danger. Please act quickly!*

📍 *Location:* ${address}
🗺️ *Maps:* ${mapsUrl}
🔋 *Battery:* ${battery ?? 'Unknown'}%
📶 *Network:* ${networkInfo?.type ?? 'Unknown'} (${networkInfo?.isConnected ? 'Connected' : 'Disconnected'})

${audioUrl ? '🎵 *Audio recording available in email notification*' : ''}

⚠️ *If you cannot reach ${senderName}, contact emergency services immediately!*`;

    // Send WhatsApp message to each contact
    const results = [];
    console.log('=== WHATSAPP DEBUG INFO ===');
    console.log('Contacts found:', contacts);
    console.log('Phone Number ID:', WHATSAPP_PHONE_NUMBER_ID);
    console.log('Token exists:', !!WHATSAPP_API_TOKEN);
    console.log('Message to send:', message);

    for (const contact of contacts) {
      try {
        // Clean WhatsApp number (remove spaces, dashes, etc.) and ensure + prefix
        let cleanNumber = contact.whatsapp.replace(/[^\d+]/g, '');
        if (!cleanNumber.startsWith('+')) {
          cleanNumber = '+' + cleanNumber;
        }
        console.log(`Sending to: ${contact.name} (${contact.whatsapp} -> ${cleanNumber})`);

        const requestBody = {
          messaging_product: "whatsapp",
          to: cleanNumber,
          type: "text",
          text: {
            body: message
          }
        };

        console.log('Request body:', JSON.stringify(requestBody, null, 2));

        const whatsappResponse = await fetch(`https://graph.facebook.com/v18.0/${WHATSAPP_PHONE_NUMBER_ID}/messages`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${WHATSAPP_API_TOKEN}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody)
        });

        const result = await whatsappResponse.json();
        console.log(`WhatsApp API Response for ${contact.name}:`, {
          status: whatsappResponse.status,
          ok: whatsappResponse.ok,
          result
        });

        results.push({
          contact: contact.name,
          whatsapp: contact.whatsapp,
          cleanNumber,
          success: whatsappResponse.ok,
          status: whatsappResponse.status,
          result
        });
      } catch (error) {
        console.error(`Error sending to ${contact.name}:`, error);
        results.push({
          contact: contact.name,
          whatsapp: contact.whatsapp,
          success: false,
          error: error.message
        });
      }
    }

    console.log('=== FINAL RESULTS ===');
    console.log('Results:', results);
    console.log('========================');

    return new Response(JSON.stringify({
      success: true,
      results,
      contactCount: contacts.length
    }), {
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    return new Response(JSON.stringify({
      error: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
});