# WhatsApp Integration Quick Start

## 🚀 Get WhatsApp Working in 15 Minutes

This is a condensed guide to get WhatsApp notifications working quickly for testing. For production setup, see `WHATSAPP_BUSINESS_API_SETUP.md`.

## Prerequisites
- Facebook account
- Phone number (not used for personal WhatsApp)
- Supabase project

## Quick Setup Steps

### 1. Create Facebook App (5 minutes)
1. Go to https://developers.facebook.com/apps/
2. Click "Create App" → "Business" → "Next"
3. App name: "SafetyAI Test"
4. Contact email: your email
5. Click "Create App"

### 2. Add WhatsApp (2 minutes)
1. In app dashboard, find "WhatsApp" product
2. Click "Set up"
3. Click "Get Started"

### 3. Add Phone Number (3 minutes)
1. Click "Add phone number"
2. Enter your test phone number
3. Verify with SMS code
4. **Copy the Phone Number ID** (looks like: 123456789012345)

### 4. Get Access Token (1 minute)
1. In WhatsApp setup page, find "Temporary access token"
2. **Copy the token** (starts with EAA...)
3. Note: This expires in 24 hours (good for testing)

### 5. Configure Supabase (2 minutes)
1. Go to Supabase Dashboard → Project Settings → Edge Functions
2. Add environment variables:
   ```
   WHATSAPP_API_TOKEN=EAA... (your token)
   WHATSAPP_PHONE_NUMBER_ID=123456789012345 (your phone number ID)
   ```

### 6. Deploy and Test (2 minutes)
1. Deploy the function:
   ```bash
   supabase functions deploy sos-whatsapp
   ```

2. Test with curl:
   ```bash
   curl -X POST https://your-project.supabase.co/functions/v1/sos-whatsapp \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer your_supabase_anon_key" \
     -d '{
       "userId": "test-user",
       "location": {
         "latitude": 37.7749,
         "longitude": -122.4194,
         "formattedAddress": "Test Location"
       },
       "battery": 85
     }'
   ```

## ✅ Success!
If everything works, you should receive a WhatsApp message with emergency details.

## 🔧 Add to Your App
1. Run database migration:
   ```sql
   -- In Supabase SQL Editor
   \i add-whatsapp-to-emergency-contacts.sql
   ```

2. Add WhatsApp number to a test contact in your app

3. Trigger SOS alert to test end-to-end

## ⚠️ Important Notes

### For Testing Only
- Temporary token expires in 24 hours
- Limited to 5 phone numbers
- Not suitable for production

### For Production
- Need business verification (2-5 days)
- Generate permanent system user token
- See full setup guide: `WHATSAPP_BUSINESS_API_SETUP.md`

## 🐛 Troubleshooting

### "Invalid Phone Number"
- Include country code: +1234567890
- Remove spaces/dashes: +1234567890 not +1 (234) 567-8900

### "Access Token Invalid"
- Token expired (24 hours for temporary)
- Regenerate token in Facebook Developer Console

### "Phone Number Not Found"
- Double-check Phone Number ID
- Ensure phone number is verified in Facebook

### "No WhatsApp Contacts Found"
- Add WhatsApp number to emergency contact in app
- Check database has whatsapp column

## 📱 Test Message Format
You should receive:
```
🚨 *DANGER! SOS Alert from User*

*This person may be in immediate danger. Please act quickly!*

📍 *Location:* Test Location
🗺️ *Maps:* https://www.google.com/maps?q=37.7749,-122.4194
🔋 *Battery:* 85%
📶 *Network:* Unknown (Connected)

⚠️ *If you cannot reach User, contact emergency services immediately!*
```

## 🎯 Next Steps
1. Test with real emergency contacts
2. Set up production WhatsApp Business API
3. Implement message templates for faster delivery
4. Add webhook for delivery status tracking

## 💡 Pro Tips
- Use a dedicated phone number for WhatsApp Business
- Test with multiple contacts to verify delivery
- Monitor Supabase Edge Function logs for debugging
- Keep temporary tokens secure and rotate regularly

This quick setup gets you testing WhatsApp notifications immediately. For production deployment with permanent tokens and business verification, follow the complete setup guide.