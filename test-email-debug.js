const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabaseUrl = 'https://pytenwpowmbdpbtonase.supabase.co';
const supabaseKey = 'your-anon-key';
const supabase = createClient(supabaseUrl, supabaseKey);

async function testEmailDebug() {
  console.log('🧪 Testing Email Sending Debug...\n');

  try {
    // 1. Test Edge Function directly
    console.log('1. Testing Edge Function...');
    
    const testData = {
      participant_id: 'test-participant-id',
      session_id: 'test-session-id',
      contact_id: 'test-contact-id',
      invited_by: 'test-user-id'
    };

    const response = await fetch('https://pytenwpowmbdpbtonase.supabase.co/functions/v1/follow-me-invite', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseKey}`,
      },
      body: JSON.stringify(testData),
    });

    const result = await response.json();
    console.log('Response status:', response.status);
    console.log('Response body:', JSON.stringify(result, null, 2));

    // 2. Check if we have any emergency contacts with emails
    console.log('\n2. Checking emergency contacts with emails...');
    const { data: contacts, error: contactsError } = await supabase
      .from('emergency_contacts')
      .select('*')
      .not('email', 'is', null)
      .not('email', 'eq', '');

    if (contactsError) {
      console.error('❌ Error getting contacts:', contactsError);
    } else {
      console.log(`✅ Found ${contacts.length} contacts with emails:`);
      contacts.forEach((contact, index) => {
        console.log(`   ${index + 1}. ${contact.name} - ${contact.email}`);
      });
    }

    // 3. Check if we have any sessions
    console.log('\n3. Checking existing sessions...');
    const { data: sessions, error: sessionsError } = await supabase
      .from('follow_me_sessions')
      .select('*')
      .limit(5);

    if (sessionsError) {
      console.error('❌ Error getting sessions:', sessionsError);
    } else {
      console.log(`✅ Found ${sessions.length} sessions:`);
      sessions.forEach((session, index) => {
        console.log(`   ${index + 1}. ${session.session_name} (${session.id})`);
      });
    }

    // 4. Check participants
    console.log('\n4. Checking participants...');
    const { data: participants, error: participantsError } = await supabase
      .from('follow_me_participants')
      .select(`
        *,
        contact:emergency_contacts(name, email),
        session:follow_me_sessions(session_name)
      `)
      .limit(5);

    if (participantsError) {
      console.error('❌ Error getting participants:', participantsError);
    } else {
      console.log(`✅ Found ${participants.length} participants:`);
      participants.forEach((participant, index) => {
        console.log(`   ${index + 1}. ${participant.contact?.name} - ${participant.status} - ${participant.session?.session_name}`);
      });
    }

    console.log('\n📝 Debug Summary:');
    console.log('   - Check if RESEND_API_KEY is set in Supabase environment variables');
    console.log('   - Check if emergency contacts have valid email addresses');
    console.log('   - Check if the Edge Function is properly deployed');
    console.log('   - Check Supabase function logs for detailed error messages');

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testEmailDebug(); 