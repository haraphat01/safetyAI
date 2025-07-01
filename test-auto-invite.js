const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabaseUrl = 'https://pytenwpowmbdpbtonase.supabase.co';
const supabaseKey = 'your-anon-key';
const supabase = createClient(supabaseUrl, supabaseKey);

async function testAutoInvite() {
  console.log('🧪 Testing Automatic Emergency Contact Invitation...\n');

  try {
    // 1. Get user's emergency contacts
    console.log('1. Getting emergency contacts...');
    const { data: contacts, error: contactsError } = await supabase
      .from('emergency_contacts')
      .select('*')
      .limit(10);

    if (contactsError) {
      console.error('❌ Error getting contacts:', contactsError);
      return;
    }

    console.log(`✅ Found ${contacts.length} emergency contacts`);
    
    if (contacts.length === 0) {
      console.log('ℹ️  No emergency contacts found. Please add some contacts first.');
      return;
    }

    // 2. Create a test session
    console.log('\n2. Creating test Follow Me session...');
    const sessionData = {
      user_id: 'test-user-id', // Replace with actual user ID
      session_name: 'Auto Invite Test Session',
      description: 'Testing automatic invitation functionality',
      is_active: true,
    };

    const { data: session, error: sessionError } = await supabase
      .from('follow_me_sessions')
      .insert(sessionData)
      .select()
      .single();

    if (sessionError) {
      console.error('❌ Error creating session:', sessionError);
      return;
    }

    console.log(`✅ Created session: "${session.session_name}" (ID: ${session.id})`);

    // 3. Simulate automatic invitation of all contacts
    console.log('\n3. Inviting all emergency contacts...');
    const participants = [];

    for (const contact of contacts) {
      try {
        const { data: participant, error: participantError } = await supabase
          .from('follow_me_participants')
          .insert({
            session_id: session.id,
            contact_id: contact.id,
            invited_by: 'test-user-id', // Replace with actual user ID
            status: 'invited',
          })
          .select()
          .single();

        if (participantError) {
          console.error(`❌ Failed to invite ${contact.name}:`, participantError);
        } else {
          participants.push(participant);
          console.log(`✅ Invited ${contact.name} (${contact.email || 'no email'})`);
        }
      } catch (error) {
        console.error(`❌ Error inviting ${contact.name}:`, error);
      }
    }

    console.log(`\n📊 Invitation Summary:`);
    console.log(`   - Total contacts: ${contacts.length}`);
    console.log(`   - Successfully invited: ${participants.length}`);
    console.log(`   - Failed invitations: ${contacts.length - participants.length}`);

    // 4. Check participants for the session
    console.log('\n4. Verifying session participants...');
    const { data: sessionParticipants, error: participantsError } = await supabase
      .from('follow_me_participants')
      .select(`
        *,
        contact:emergency_contacts(name, email, phone, relationship)
      `)
      .eq('session_id', session.id);

    if (participantsError) {
      console.error('❌ Error getting participants:', participantsError);
    } else {
      console.log(`✅ Session has ${sessionParticipants.length} participants:`);
      sessionParticipants.forEach((p, index) => {
        console.log(`   ${index + 1}. ${p.contact?.name} (${p.status})`);
      });
    }

    // 5. Clean up test session
    console.log('\n5. Cleaning up test session...');
    const { error: cleanupError } = await supabase
      .from('follow_me_sessions')
      .delete()
      .eq('id', session.id);

    if (cleanupError) {
      console.error('❌ Error cleaning up session:', cleanupError);
    } else {
      console.log('✅ Test session cleaned up');
    }

    console.log('\n🎉 Automatic invitation test completed!');
    console.log('\n📝 Key Points:');
    console.log('   - All emergency contacts should be automatically invited');
    console.log('   - Each contact should receive an email invitation');
    console.log('   - Participants should appear in the session immediately');
    console.log('   - No manual invitation process needed');

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testAutoInvite(); 