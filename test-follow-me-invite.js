const { createClient } = require('@supabase/supabase-js');

// Replace with your actual Supabase URL and anon key
const supabaseUrl = 'https://pytenwpowmbdpbtonase.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB5dGVud3Bvd21iZHBidG9uYXNlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA2OTIzNDgsImV4cCI6MjA2NjI2ODM0OH0.59FXTuGKNvJW05h-1SfOPuvrNC8g7gMOgC1OcNkW4PI';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testFollowMeInvite() {
  console.log('🧪 Testing Follow Me Invite Edge Function...');
  
  try {
    // First, let's check if we have any users and contacts
    console.log('1. Checking for users and contacts...');
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      console.log('❌ No authenticated user found. Please sign in first.');
      return;
    }
    
    console.log('✅ Authenticated user:', user.email);
    
    // Get emergency contacts
    const { data: contacts, error: contactsError } = await supabase
      .from('emergency_contacts')
      .select('*')
      .eq('user_id', user.id);
    
    if (contactsError) {
      console.error('❌ Error fetching contacts:', contactsError);
      return;
    }
    
    if (!contacts || contacts.length === 0) {
      console.log('❌ No emergency contacts found. Please add some contacts first.');
      return;
    }
    
    console.log('✅ Found contacts:', contacts.length);
    
    // Get or create a test session
    console.log('2. Creating or getting a test session...');
    
    let { data: sessions, error: sessionsError } = await supabase
      .from('follow_me_sessions')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true);
    
    if (sessionsError) {
      console.error('❌ Error fetching sessions:', sessionsError);
      return;
    }
    
    let testSession;
    if (!sessions || sessions.length === 0) {
      // Create a test session
      const { data: newSession, error: createError } = await supabase
        .from('follow_me_sessions')
        .insert({
          user_id: user.id,
          session_name: 'Test Follow Me Session',
          description: 'This is a test session for email invites',
          is_active: true,
        })
        .select()
        .single();
      
      if (createError) {
        console.error('❌ Error creating test session:', createError);
        return;
      }
      
      testSession = newSession;
      console.log('✅ Created test session:', testSession.id);
    } else {
      testSession = sessions[0];
      console.log('✅ Using existing session:', testSession.id);
    }
    
    // Check if contact already has an email
    const contactWithEmail = contacts.find(c => c.email);
    if (!contactWithEmail) {
      console.log('❌ No contacts with email addresses found. Please add an email to a contact.');
      return;
    }
    
    console.log('✅ Using contact with email:', contactWithEmail.name, contactWithEmail.email);
    
    // Test the Edge Function directly
    console.log('3. Testing Edge Function...');
    
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) {
      console.log('❌ No valid session token found');
      return;
    }
    
    const testInviteData = {
      participant_id: 'test-participant-id',
      session_id: testSession.id,
      contact_id: contactWithEmail.id,
      invited_by: user.id,
    };
    
    const response = await fetch(`${supabaseUrl}/functions/v1/follow-me-invite`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
      },
      body: JSON.stringify(testInviteData),
    });
    
    const result = await response.json();
    
    if (!response.ok) {
      console.error('❌ Edge Function test failed:', result);
      return;
    }
    
    console.log('✅ Edge Function test successful:', result);
    console.log('');
    console.log('📧 Check the email inbox for:', contactWithEmail.email);
    console.log('   Subject should be: "📍 [User Name] invited you to follow their journey - Test Follow Me Session"');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testFollowMeInvite(); 