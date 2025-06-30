# SOS Functionality Troubleshooting Guide

## Issue: SOS is not working - not sending SOS data and not recording audio

### Root Cause
The main issue is that the Supabase Storage bucket `sos-audio` doesn't exist, which prevents audio file uploads during SOS alerts. This causes the entire SOS functionality to fail.

### Solution Steps

#### 1. Set up Supabase Storage Bucket

**Option A: Using the Setup Script (Recommended)**

1. Get your Supabase Service Role Key:
   - Go to your Supabase Dashboard
   - Navigate to Settings > API
   - Copy the `service_role` key (not the anon key)

2. Run the setup script:
   ```bash
   export SUPABASE_SERVICE_ROLE_KEY="your_service_role_key_here"
   node scripts/setup-storage-bucket.js
   ```

**Option B: Manual Setup**

1. Go to your Supabase Dashboard
2. Navigate to Storage
3. Click "Create a new bucket"
4. Name it: `sos-audio`
5. Make it public
6. Set file size limit to 50MB
7. Add allowed MIME types: `audio/m4a`, `audio/mp3`, `audio/wav`, `audio/aac`

#### 2. Update App Permissions

The app.json file has been updated with the necessary permissions for:
- Audio recording (microphone)
- Location access
- Background processing
- Network access

Make sure to rebuild your app after these changes:
```bash
npx expo run:ios
# or
npx expo run:android
```

#### 3. Run Database Setup

Execute the storage setup SQL in your Supabase SQL Editor:
```sql
-- Run the contents of setup-storage.sql
```

#### 4. Test the Setup

Run the storage test to verify everything is working:
```bash
node test-storage.js
```

### Debugging

The app now includes comprehensive logging for SOS functionality. Check the console logs for:

- `=== SOS BUTTON PRESSED ===` - When SOS is triggered
- `=== STARTING AUDIO RECORDING ===` - Audio recording process
- `=== UPLOADING AUDIO FILE ===` - File upload process
- `=== SENDING SOS DATA ===` - Data transmission process

### Common Issues and Fixes

#### Issue: "Audio permission denied"
**Fix**: Make sure to grant microphone permissions when prompted by the app.

#### Issue: "Location permission denied"
**Fix**: Make sure to grant location permissions when prompted by the app.

#### Issue: "Unable to upload audio to any storage bucket"
**Fix**: Follow the storage bucket setup steps above.

#### Issue: "No authentication token available"
**Fix**: Make sure the user is properly logged in to Supabase.

#### Issue: "Edge function failed"
**Fix**: Check that the `sos-email` edge function is deployed and has the correct environment variables (RESEND_API_KEY).

### Environment Variables Required

Make sure these environment variables are set in your Supabase Edge Functions:

- `RESEND_API_KEY` - For sending email notifications
- `SUPABASE_URL` - Your Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY` - Your service role key

### Testing the SOS Functionality

1. Make sure you have emergency contacts added in the app
2. Press the SOS button
3. Check console logs for debugging information
4. Verify that:
   - Audio recording starts
   - Location is captured
   - Data is sent to the edge function
   - Email notifications are sent to contacts

### Additional Notes

- The SOS functionality records audio in 1-minute intervals
- Audio files are automatically cleaned up after 7 days
- The app will continue recording and sending data until SOS is manually stopped
- All SOS data is stored in the `sos_data` table for history tracking

If you continue to have issues after following these steps, check the console logs for specific error messages and ensure all permissions are properly granted on your device. 