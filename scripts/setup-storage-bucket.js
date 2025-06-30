const { createClient } = require('@supabase/supabase-js');

// Supabase configuration with service role key for admin access
const supabaseUrl = 'https://pytenwpowmbdpbtonase.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'YOUR_SERVICE_ROLE_KEY_HERE';

if (supabaseServiceKey === 'YOUR_SERVICE_ROLE_KEY_HERE') {
  console.error('❌ Please set your SUPABASE_SERVICE_ROLE_KEY environment variable');
  console.log('You can find this in your Supabase Dashboard > Settings > API > service_role key');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function setupStorageBucket() {
  console.log('🔧 Setting up Supabase Storage for SOS Audio...');
  
  try {
    // 1. List existing buckets
    console.log('\n1. Checking existing buckets...');
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    
    if (bucketsError) {
      console.error('Error listing buckets:', bucketsError);
      return;
    }
    
    console.log('Existing buckets:', buckets.map(b => b.name));
    
    // 2. Check if sos-audio bucket exists
    const sosAudioBucket = buckets.find(b => b.name === 'sos-audio');
    
    if (sosAudioBucket) {
      console.log('✅ sos-audio bucket already exists');
    } else {
      console.log('\n2. Creating sos-audio bucket...');
      
      const { data: newBucket, error: createError } = await supabase.storage.createBucket('sos-audio', {
        public: true,
        allowedMimeTypes: ['audio/m4a', 'audio/mp3', 'audio/wav', 'audio/aac'],
        fileSizeLimit: 52428800 // 50MB
      });
      
      if (createError) {
        console.error('❌ Error creating sos-audio bucket:', createError);
        return;
      }
      
      console.log('✅ sos-audio bucket created successfully');
    }
    
    // 3. Test file upload
    console.log('\n3. Testing file upload...');
    const testFileName = `test-${Date.now()}.txt`;
    const testContent = 'Test file for SOS audio functionality';
    const testBytes = new TextEncoder().encode(testContent);
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('sos-audio')
      .upload(testFileName, testBytes, {
        contentType: 'text/plain',
        upsert: true
      });
    
    if (uploadError) {
      console.error('❌ Error uploading test file:', uploadError);
      return;
    }
    
    console.log('✅ Test file uploaded successfully');
    
    // 4. Test public URL generation
    console.log('\n4. Testing public URL generation...');
    const { data: urlData } = supabase.storage
      .from('sos-audio')
      .getPublicUrl(testFileName);
    
    console.log('✅ Public URL generated:', urlData.publicUrl);
    
    // 5. Clean up test file
    console.log('\n5. Cleaning up test file...');
    const { error: deleteError } = await supabase.storage
      .from('sos-audio')
      .remove([testFileName]);
    
    if (deleteError) {
      console.error('⚠️  Error deleting test file:', deleteError);
    } else {
      console.log('✅ Test file cleaned up');
    }
    
    console.log('\n🎉 Storage setup completed successfully!');
    console.log('Your SOS audio functionality should now work properly.');
    
  } catch (error) {
    console.error('❌ Setup failed:', error);
  }
}

// Run the setup
setupStorageBucket(); 