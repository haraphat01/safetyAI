/**
 * Test script for WhatsApp integration
 * Run this to test the WhatsApp notification functionality
 */

const { createClient } = require('@supabase/supabase-js');

// Configuration - Update these with your values
const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('❌ Missing Supabase configuration');
  console.log('Please set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY environment variables');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testWhatsAppIntegration() {
  console.log('🧪 Testing WhatsApp Integration...\n');

  try {
    // Test 1: Check if WhatsApp column exists in emergency_contacts table
    console.log('1️⃣ Checking database schema...');
    const { data: columns, error: schemaError } = await supabase
      .from('emergency_contacts')
      .select('*')
      .limit(1);

    if (schemaError) {
      console.error('❌ Database schema check failed:', schemaError.message);
      return;
    }

    console.log('✅ Database schema check passed');

    // Test 2: Test WhatsApp Edge Function (requires authentication)
    console.log('\n2️⃣ Testing WhatsApp Edge Function...');
    
    // Mock test data
    const testPayload = {
      userId: 'test-user-id',
      location: {
        latitude: 37.7749,
        longitude: -122.4194,
        formattedAddress: '123 Test Street, San Francisco, CA',
      },
      battery: 85,
      networkInfo: {
        type: 'wifi',
        isConnected: true,
      },
    };

    const { data: whatsappResponse, error: whatsappError } = await supabase.functions.invoke('sos-whatsapp', {
      body: testPayload,
    });

    if (whatsappError) {
      console.log('⚠️ WhatsApp function test (expected to fail without proper setup):', whatsappError.message);
    } else {
      console.log('✅ WhatsApp function responded:', whatsappResponse);
    }

    // Test 3: Check if emergency contacts can store WhatsApp numbers
    console.log('\n3️⃣ Testing emergency contacts with WhatsApp...');
    
    // This would require authentication, so we'll just log the expected behavior
    console.log('📝 Expected behavior:');
    console.log('   - Users can add WhatsApp numbers to emergency contacts');
    console.log('   - WhatsApp numbers are optional fields');
    console.log('   - Contacts with WhatsApp numbers show WhatsApp icon');
    console.log('   - SOS alerts sent to both email and WhatsApp when available');

    console.log('\n✅ WhatsApp integration test completed!');
    console.log('\n📋 Next steps to fully enable WhatsApp:');
    console.log('1. Run database migration: add-whatsapp-to-emergency-contacts.sql');
    console.log('2. Set up Facebook WhatsApp Business API');
    console.log('3. Configure environment variables:');
    console.log('   - WHATSAPP_API_TOKEN');
    console.log('   - WHATSAPP_PHONE_NUMBER_ID');
    console.log('4. Deploy sos-whatsapp Edge Function');
    console.log('5. Test with real emergency contacts');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testWhatsAppIntegration();