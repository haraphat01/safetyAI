const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabaseUrl = 'https://your-project.supabase.co';
const supabaseKey = 'your-anon-key';
const supabase = createClient(supabaseUrl, supabaseKey);

async function testDeleteSession() {
  console.log('🧪 Testing Follow Me Session Deletion...\n');

  try {
    // 1. Get user sessions
    console.log('1. Getting user sessions...');
    const { data: sessions, error: sessionsError } = await supabase
      .from('follow_me_sessions')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5);

    if (sessionsError) {
      console.error('❌ Error getting sessions:', sessionsError);
      return;
    }

    console.log(`✅ Found ${sessions.length} sessions`);
    
    if (sessions.length === 0) {
      console.log('ℹ️  No sessions found to test deletion');
      return;
    }

    // 2. Find a session to delete (preferably an ended one)
    const sessionToDelete = sessions.find(s => !s.is_active) || sessions[0];
    console.log(`\n2. Selected session to delete: "${sessionToDelete.session_name}" (ID: ${sessionToDelete.id})`);

    // 3. Check related data before deletion
    console.log('\n3. Checking related data...');
    
    const { data: participants, error: participantsError } = await supabase
      .from('follow_me_participants')
      .select('*')
      .eq('session_id', sessionToDelete.id);

    if (participantsError) {
      console.error('❌ Error getting participants:', participantsError);
    } else {
      console.log(`✅ Found ${participants.length} participants`);
    }

    const { data: locations, error: locationsError } = await supabase
      .from('follow_me_locations')
      .select('*')
      .eq('session_id', sessionToDelete.id);

    if (locationsError) {
      console.error('❌ Error getting locations:', locationsError);
    } else {
      console.log(`✅ Found ${locations.length} location records`);
    }

    // 4. Delete the session (this should cascade delete related data)
    console.log('\n4. Deleting session...');
    
    // First delete participants
    if (participants.length > 0) {
      const { error: deleteParticipantsError } = await supabase
        .from('follow_me_participants')
        .delete()
        .eq('session_id', sessionToDelete.id);

      if (deleteParticipantsError) {
        console.error('❌ Error deleting participants:', deleteParticipantsError);
        return;
      }
      console.log('✅ Participants deleted');
    }

    // Then delete locations
    if (locations.length > 0) {
      const { error: deleteLocationsError } = await supabase
        .from('follow_me_locations')
        .delete()
        .eq('session_id', sessionToDelete.id);

      if (deleteLocationsError) {
        console.error('❌ Error deleting locations:', deleteLocationsError);
        return;
      }
      console.log('✅ Location records deleted');
    }

    // Finally delete the session
    const { error: deleteSessionError } = await supabase
      .from('follow_me_sessions')
      .delete()
      .eq('id', sessionToDelete.id);

    if (deleteSessionError) {
      console.error('❌ Error deleting session:', deleteSessionError);
      return;
    }

    console.log('✅ Session deleted successfully');

    // 5. Verify deletion
    console.log('\n5. Verifying deletion...');
    
    const { data: verifySession, error: verifySessionError } = await supabase
      .from('follow_me_sessions')
      .select('*')
      .eq('id', sessionToDelete.id)
      .single();

    if (verifySessionError && verifySessionError.code === 'PGRST116') {
      console.log('✅ Session successfully deleted (not found)');
    } else if (verifySession) {
      console.log('❌ Session still exists after deletion');
    }

    const { data: verifyParticipants, error: verifyParticipantsError } = await supabase
      .from('follow_me_participants')
      .select('*')
      .eq('session_id', sessionToDelete.id);

    if (verifyParticipantsError) {
      console.error('❌ Error verifying participants:', verifyParticipantsError);
    } else if (verifyParticipants.length === 0) {
      console.log('✅ All participants successfully deleted');
    } else {
      console.log(`❌ ${verifyParticipants.length} participants still exist`);
    }

    const { data: verifyLocations, error: verifyLocationsError } = await supabase
      .from('follow_me_locations')
      .select('*')
      .eq('session_id', sessionToDelete.id);

    if (verifyLocationsError) {
      console.error('❌ Error verifying locations:', verifyLocationsError);
    } else if (verifyLocations.length === 0) {
      console.log('✅ All location records successfully deleted');
    } else {
      console.log(`❌ ${verifyLocations.length} location records still exist`);
    }

    console.log('\n🎉 Session deletion test completed successfully!');

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testDeleteSession(); 