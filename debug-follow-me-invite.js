const { createClient } = require('@supabase/supabase-js');

// Replace with your actual Supabase URL and anon key
const supabaseUrl = 'https://pytenwpowmbdpbtonase.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB5dGVud3Bvd21iZHBidG9uYXNlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA2OTIzNDgsImV4cCI6MjA2NjI2ODM0OH0.59FXTuGKNvJW05h-1SfOPuvrNC8g7gMOgC1OcNkW4PI';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function debugFollowMeInvite() {
  console.log('🔍 Debugging Follow Me Email Invite Issue...');
  console.log('==========================================');
  
  try {
    // 1. Check authentication
    console.log('\n1. Checking authentication...');
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      console.log('❌ No authenticated user found. Please sign in first.');
      console.log('   This is required to test the Follow Me invite feature.');
      return;
    }
    console.log('✅ Authenticated user:', user.email);
    
    // 2. Check emergency contacts
    console.log('\n2. Checking emergency contacts...');
    const { data: contacts, error: contactsError } = await supabase
      .from('emergency_contacts')
      .select('*')
      .eq('user_id', user.id);
    
    if (contactsError) {
      console.error('❌ Error fetching contacts:', contactsError);
      return;
    }
    
    if (!contacts || contacts.length === 0) {
      console.log('❌ No emergency contacts found.');
      console.log('   Please add emergency contacts first in the app.');
      return;
    }
    
    console.log('✅ Found contacts:', contacts.length);
    
    // Check which contacts have emails
    const contactsWithEmail = contacts.filter(c => c.email);
    const contactsWithoutEmail = contacts.filter(c => !c.email);
    
    console.log(`   - Contacts with email: ${contactsWithEmail.length}`);
    console.log(`   - Contacts without email: ${contactsWithoutEmail.length}`);
    
    if (contactsWithoutEmail.length > 0) {
      console.log('\n⚠️  Contacts without email addresses:');
      contactsWithoutEmail.forEach(contact => {
        console.log(`   - ${contact.name} (${contact.phone})`);
      });
      console.log('\n   These contacts cannot receive email invites.');
    }
    
    if (contactsWithEmail.length === 0) {
      console.log('\n❌ No contacts have email addresses.');
      console.log('   Please add email addresses to your emergency contacts.');
      return;
    }
    
    // 3. Check Follow Me sessions
    console.log('\n3. Checking Follow Me sessions...');
    const { data: sessions, error: sessionsError } = await supabase
      .from('follow_me_sessions')
      .select('*')
      .eq('user_id', user.id);
    
    if (sessionsError) {
      console.error('❌ Error fetching sessions:', sessionsError);
      return;
    }
    
    console.log(`✅ Found sessions: ${sessions?.length || 0}`);
    
    // 4. Check Follow Me participants
    console.log('\n4. Checking Follow Me participants...');
    const { data: participants, error: participantsError } = await supabase
      .from('follow_me_participants')
      .select(`
        *,
        contact:emergency_contacts(name, email, phone),
        session:follow_me_sessions(session_name, is_active)
      `)
      .eq('invited_by', user.id);
    
    if (participantsError) {
      console.error('❌ Error fetching participants:', participantsError);
      return;
    }
    
    console.log(`✅ Found participants: ${participants?.length || 0}`);
    
    if (participants && participants.length > 0) {
      console.log('\n📋 Participant details:');
      participants.forEach(participant => {
        console.log(`   - ${participant.contact?.name || 'Unknown'} (${participant.contact?.email || 'No email'})`);
        console.log(`     Status: ${participant.status}`);
        console.log(`     Session: ${participant.session?.session_name || 'Unknown'}`);
        console.log(`     Created: ${new Date(participant.created_at).toLocaleString()}`);
        console.log('');
      });
    }
    
    // 5. Test Edge Function directly
    console.log('\n5. Testing Edge Function...');
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) {
      console.log('❌ No valid session token found');
      return;
    }
    
    // Use the first contact with email and first session
    const testContact = contactsWithEmail[0];
    const testSession = sessions && sessions.length > 0 ? sessions[0] : null;
    
    if (!testSession) {
      console.log('❌ No sessions found. Please create a Follow Me session first.');
      return;
    }
    
    console.log(`   Testing with contact: ${testContact.name} (${testContact.email})`);
    console.log(`   Testing with session: ${testSession.session_name}`);
    
    const testInviteData = {
      participant_id: 'test-participant-id',
      session_id: testSession.id,
      contact_id: testContact.id,
      invited_by: user.id,
    };
    
    console.log('\n   Sending test request to Edge Function...');
    const response = await fetch(`${supabaseUrl}/functions/v1/FollowMeService`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
      },
      body: JSON.stringify(testInviteData),
    });
    
    const result = await response.json();
    
    console.log(`   Response status: ${response.status}`);
    console.log(`   Response:`, JSON.stringify(result, null, 2));
    
    if (!response.ok) {
      console.log('\n❌ Edge Function test failed!');
      console.log('   This could be due to:');
      console.log('   - Edge Function not deployed');
      console.log('   - Missing environment variables');
      console.log('   - Function name mismatch');
      console.log('   - Authentication issues');
    } else {
      console.log('\n✅ Edge Function test successful!');
      console.log(`   Check the email inbox for: ${testContact.email}`);
    }
    
    // 6. Check database tables
    console.log('\n6. Checking database tables...');
    
    // Check if follow_me tables exist
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .like('table_name', 'follow_me%');
    
    if (tablesError) {
      console.log('⚠️  Could not check table existence (permission issue)');
    } else {
      const tableNames = tables?.map(t => t.table_name) || [];
      console.log('✅ Follow Me tables found:', tableNames);
      
      if (!tableNames.includes('follow_me_sessions')) {
        console.log('❌ follow_me_sessions table not found!');
        console.log('   Run the follow-me-table.sql script in your Supabase SQL Editor.');
      }
      if (!tableNames.includes('follow_me_participants')) {
        console.log('❌ follow_me_participants table not found!');
        console.log('   Run the follow-me-table.sql script in your Supabase SQL Editor.');
      }
      if (!tableNames.includes('follow_me_locations')) {
        console.log('❌ follow_me_locations table not found!');
        console.log('   Run the follow-me-table.sql script in your Supabase SQL Editor.');
      }
    }
    
  } catch (error) {
    console.error('❌ Debug failed:', error);
  }
  
  console.log('\n==========================================');
  console.log('🔍 Debug complete!');
  console.log('\nNext steps:');
  console.log('1. Make sure you have emergency contacts with email addresses');
  console.log('2. Create a Follow Me session in the app');
  console.log('3. Try inviting a contact from the app');
  console.log('4. Check your Supabase Edge Function logs');
  console.log('5. Verify your Resend API key is set correctly');
}

// Run the debug
debugFollowMeInvite(); 