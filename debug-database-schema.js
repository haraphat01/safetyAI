// Debug script to check database schema and connection
// Run this with: node debug-database-schema.js

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  console.log('Make sure you have EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY in your .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugDatabase() {
  console.log('🔍 Debugging database schema...\n');

  try {
    // Test 1: Check if we can connect to Supabase
    console.log('1️⃣ Testing Supabase connection...');
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError && authError.message !== 'Auth session missing!') {
      console.log('⚠️  Auth error (this is normal for anonymous connection):', authError.message);
    } else {
      console.log('✅ Supabase connection successful');
    }

    // Test 2: Check emergency_contacts table structure
    console.log('\n2️⃣ Checking emergency_contacts table...');
    const { data: tableInfo, error: tableError } = await supabase
      .from('emergency_contacts')
      .select('*')
      .limit(0);

    if (tableError) {
      console.log('❌ Error accessing emergency_contacts table:', tableError);
      console.log('\n🔧 Possible solutions:');
      console.log('1. Run the fix-emergency-contacts-schema.sql script in Supabase SQL Editor');
      console.log('2. Check if the table exists in your Supabase dashboard');
      console.log('3. Verify your RLS policies allow access');
    } else {
      console.log('✅ emergency_contacts table is accessible');
    }

    // Test 3: Try to get table schema information
    console.log('\n3️⃣ Checking table schema...');
    const { data: schemaData, error: schemaError } = await supabase.rpc('get_table_schema', {
      table_name: 'emergency_contacts'
    });

    if (schemaError) {
      console.log('⚠️  Could not get schema info (this is normal):', schemaError.message);
    } else {
      console.log('📋 Table schema:', schemaData);
    }

    // Test 4: Try a simple insert to see what happens
    console.log('\n4️⃣ Testing insert operation...');
    const testContact = {
      name: 'Test Contact',
      email: 'test@example.com',
      whatsapp: '+1234567890',
      relationship: 'Friend'
    };

    const { data: insertData, error: insertError } = await supabase
      .from('emergency_contacts')
      .insert(testContact)
      .select();

    if (insertError) {
      console.log('❌ Insert error:', insertError);
      console.log('\n🔧 This error shows what\'s wrong with the schema');
    } else {
      console.log('✅ Test insert successful:', insertData);
      
      // Clean up test data
      if (insertData && insertData[0]) {
        await supabase
          .from('emergency_contacts')
          .delete()
          .eq('id', insertData[0].id);
        console.log('🧹 Cleaned up test data');
      }
    }

  } catch (error) {
    console.error('💥 Unexpected error:', error);
  }
}

debugDatabase();