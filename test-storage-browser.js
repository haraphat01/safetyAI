// Test script for browser console
// Copy and paste this into your browser console on any page

// Replace with your actual Supabase URL and anon key
const supabaseUrl = 'https://pytenwpowmbdpbtonase.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB5dGVud3Bvd21iZHBidG9uYXNlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA2OTIzNDgsImV4cCI6MjA2NjI2ODM0OH0.59FXTuGKNvJW05h-1SfOPuvrNC8g7gMOgC1OcNkW4PI';

// Load Supabase client (if not already loaded)
if (typeof supabase === 'undefined') {
  const script = document.createElement('script');
  script.src = 'https://unpkg.com/@supabase/supabase-js@2';
  document.head.appendChild(script);
  
  script.onload = () => {
    window.supabase = window.supabase.createClient(supabaseUrl, supabaseAnonKey);
    runTest();
  };
} else {
  runTest();
}

async function runTest() {
  console.log('🔍 Testing Supabase Storage setup...');
  
  try {
    // 1. Test bucket listing
    console.log('1️⃣ Testing bucket listing...');
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    
    if (bucketsError) {
      console.error('❌ Error listing buckets:', bucketsError);
      return;
    }
    
    console.log('📦 Available buckets:', buckets.map(b => b.name));
    
    // 2. Check if sos-audio bucket exists
    const sosAudioBucket = buckets.find(b => b.name === 'sos-audio');
    if (!sosAudioBucket) {
      console.error('❌ sos-audio bucket not found!');
      console.log('📋 Please create the bucket manually:');
      console.log('   1. Go to Supabase Dashboard > Storage');
      console.log('   2. Click "Create a new bucket"');
      console.log('   3. Name: "sos-audio"');
      console.log('   4. Check "Public bucket"');
      console.log('   5. Click Create');
      return;
    }
    
    console.log('✅ sos-audio bucket found!');
    
    // 3. Test file listing
    console.log('2️⃣ Testing file listing...');
    const { data: files, error: filesError } = await supabase.storage
      .from('sos-audio')
      .list();
    
    if (filesError) {
      console.error('❌ Error listing files:', filesError);
      console.log('🔧 This might be due to missing RLS policies.');
      console.log('📋 Set up policies in Supabase Dashboard > Storage > sos-audio > Policies');
      return;
    }
    
    console.log('✅ Can list files in sos-audio bucket');
    console.log('📁 Files in bucket:', files);
    
    // 4. Test public URL generation
    console.log('3️⃣ Testing public URL generation...');
    const { data: urlData } = supabase.storage
      .from('sos-audio')
      .getPublicUrl('test-file.m4a');
    
    console.log('✅ Public URL generation works');
    console.log('🔗 Example URL:', urlData.publicUrl);
    
    console.log('\n🎉 Storage setup appears to be working correctly!');
    console.log('📱 Your app should now be able to upload audio files.');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
} 