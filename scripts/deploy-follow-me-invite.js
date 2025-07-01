const { execSync } = require('child_process');
const path = require('path');

console.log('🚀 Deploying Follow Me Invite Edge Function...');

try {
  // Navigate to the supabase directory
  const supabaseDir = path.join(__dirname, '..', 'supabase');
  process.chdir(supabaseDir);

  // Deploy the follow-me-invite function
  console.log('📦 Deploying follow-me-invite function...');
  execSync('supabase functions deploy follow-me-invite', { 
    stdio: 'inherit',
    env: { ...process.env }
  });

  console.log('✅ Follow Me Invite Edge Function deployed successfully!');
  console.log('');
  console.log('📧 The function will now send email invites when participants are added to Follow Me sessions.');
  console.log('');
  console.log('🔧 Make sure you have set up the following environment variables in your Supabase project:');
  console.log('   - RESEND_API_KEY: Your Resend API key for sending emails');
  console.log('   - SUPABASE_URL: Your Supabase project URL');
  console.log('   - SUPABASE_SERVICE_ROLE_KEY: Your Supabase service role key');
  console.log('');
  console.log('🌐 You can set these in your Supabase Dashboard:');
  console.log('   Settings > Functions > Environment Variables');

} catch (error) {
  console.error('❌ Failed to deploy Follow Me Invite Edge Function:', error.message);
  console.log('');
  console.log('🔧 Troubleshooting:');
  console.log('1. Make sure you have Supabase CLI installed: npm install -g supabase');
  console.log('2. Make sure you are logged in: supabase login');
  console.log('3. Make sure you have linked your project: supabase link --project-ref YOUR_PROJECT_REF');
  console.log('4. Check that the function directory exists: supabase/functions/follow-me-invite/');
  process.exit(1);
} 