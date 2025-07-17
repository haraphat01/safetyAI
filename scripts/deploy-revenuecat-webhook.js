#!/usr/bin/env node

const { execSync } = require('child_process');
const path = require('path');

console.log('🚀 Deploying RevenueCat webhook...');

try {
  // Navigate to the supabase directory
  const supabaseDir = path.join(__dirname, '..', 'supabase');
  process.chdir(supabaseDir);

  // Deploy the webhook function
  console.log('📦 Deploying webhook function...');
  execSync('supabase functions deploy revenuecat-webhook', { 
    stdio: 'inherit',
    env: { ...process.env }
  });

  console.log('✅ RevenueCat webhook deployed successfully!');
  console.log('');
  console.log('🔗 Webhook URL: https://your-project.supabase.co/functions/v1/revenuecat-webhook');
  console.log('');
  console.log('📋 Next steps:');
  console.log('1. Go to RevenueCat Dashboard → Project Settings → Webhooks');
  console.log('2. Add the webhook URL above');
  console.log('3. Select these events: INITIAL_PURCHASE, RENEWAL, CANCELLATION, TRIAL_STARTED, TRIAL_CONVERTED, EXPIRATION');
  console.log('4. Save the webhook configuration');
  console.log('');
  console.log('🧪 Test the webhook by making a test purchase in sandbox mode');

} catch (error) {
  console.error('❌ Failed to deploy RevenueCat webhook:', error.message);
  process.exit(1);
} 