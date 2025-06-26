// Test script to verify Supabase Storage setup
// Run this in your browser console or as a Node.js script

const { createClient } = require('@supabase/supabase-js');

// Replace with your actual Supabase URL and anon key
const supabaseUrl = 'https://pytenwpowmbdpbtonase.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB5dGVud3Bvd21iZHBidG9uYXNlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA2OTIzNDgsImV4cCI6MjA2NjI2ODM0OH0.59FXTuGKNvJW05h-1SfOPuvrNC8g7gMOgC1OcNkW4PI';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testStorageSetup() {
  console.log('Testing Supabase Storage setup...');
  
  try {
    // 1. Test if we can list buckets
    console.log('1. Testing bucket listing...');
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    
    if (bucketsError) {
      console.error('Error listing buckets:', bucketsError);
      return;
    }
    
    console.log('Available buckets:', buckets.map(b => b.name));
    
    // 2. Check if sos-audio bucket exists
    const sosAudioBucket = buckets.find(b => b.name === 'sos-audio');
    if (!sosAudioBucket) {
      console.error('❌ sos-audio bucket not found!');
      console.log('Please create the bucket manually in Supabase Dashboard:');
      console.log('1. Go to Storage in your Supabase dashboard');
      console.log('2. Click "Create a new bucket"');
      console.log('3. Name it "sos-audio"');
      console.log('4. Make it public');
      return;
    }
    
    console.log('✅ sos-audio bucket found!');
    
    // 3. Test if we can list files in the bucket
    console.log('2. Testing file listing...');
    const { data: files, error: filesError } = await supabase.storage
      .from('sos-audio')
      .list();
    
    if (filesError) {
      console.error('Error listing files:', filesError);
      console.log('This might be due to RLS policies. Check the setup-storage.sql file.');
      return;
    }
    
    console.log('✅ Can list files in sos-audio bucket');
    console.log('Files in bucket:', files);
    
    // 4. Test if we can get a public URL (this should work even without files)
    console.log('3. Testing public URL generation...');
    const { data: urlData } = supabase.storage
      .from('sos-audio')
      .getPublicUrl('test-file.m4a');
    
    console.log('✅ Public URL generation works');
    console.log('Example public URL:', urlData.publicUrl);
    
    console.log('\n🎉 Storage setup appears to be working correctly!');
    console.log('Your app should now be able to upload audio files.');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testStorageSetup(); 