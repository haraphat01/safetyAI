const { createClient } = require('@supabase/supabase-js');

// Replace with your actual Supabase URL and anon key
const supabaseUrl = 'https://pytenwpowmbdpbtonase.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB5dGVud3Bvd21iZHBidG9uYXNlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA2OTIzNDgsImV4cCI6MjA2NjI2ODM0OH0.59FXTuGKNvJW05h-1SfOPuvrNC8g7gMOgC1OcNkW4PI';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testFollowMeBasic() {
  console.log('🔍 Basic Follow Me Setup Test...');
  console.log('================================');
  
  try {
    // 1. Test Edge Function availability
    console.log('\n1. Testing Edge Function availability...');
    try {
      const response = await fetch(`${supabaseUrl}/functions/v1/FollowMeService`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          test: true
        }),
      });
      
      console.log(`   Response status: ${response.status}`);
      
      if (response.status === 401) {
        console.log('✅ Edge Function exists but requires authentication (expected)');
      } else if (response.status === 404) {
        console.log('❌ Edge Function not found!');
        console.log('   Please deploy the FollowMeService Edge Function.');
        console.log('   Run: supabase functions deploy FollowMeService');
      } else {
        console.log(`   Unexpected status: ${response.status}`);
      }
    } catch (error) {
      console.log('❌ Error testing Edge Function:', error.message);
    }
    
    // 2. Check if we can access the database (basic connectivity)
    console.log('\n2. Testing database connectivity...');
    try {
      // Try to access a public table or function
      const { data, error } = await supabase
        .from('users')
        .select('count')
        .limit(1);
      
      if (error) {
        console.log('⚠️  Database access test failed:', error.message);
        console.log('   This might be due to RLS policies (expected for users table)');
      } else {
        console.log('✅ Database connectivity works');
      }
    } catch (error) {
      console.log('❌ Database connectivity failed:', error.message);
    }
    
    // 3. Check Supabase project status
    console.log('\n3. Checking Supabase project status...');
    try {
      const response = await fetch(`${supabaseUrl}/rest/v1/`, {
        headers: {
          'apikey': supabaseAnonKey,
          'Authorization': `Bearer ${supabaseAnonKey}`
        }
      });
      
      if (response.ok) {
        console.log('✅ Supabase project is accessible');
      } else {
        console.log(`⚠️  Supabase project status: ${response.status}`);
      }
    } catch (error) {
      console.log('❌ Cannot access Supabase project:', error.message);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
  
  console.log('\n================================');
  console.log('🔍 Basic test complete!');
  console.log('\nTo fix email invite issues:');
  console.log('1. Make sure you have emergency contacts with email addresses');
  console.log('2. Deploy the FollowMeService Edge Function');
  console.log('3. Set up Resend API key in Supabase environment variables');
  console.log('4. Test from the app while signed in');
}

// Run the test
testFollowMeBasic(); 