# WhatsApp Business API Setup Guide

## Overview

This guide walks you through setting up WhatsApp Business API to send emergency notifications from your SafetyAI app. You'll need to create a Facebook Developer account, set up a WhatsApp Business app, and configure your phone number.

## Prerequisites

- **Business Verification**: You'll need a verified business (can be sole proprietorship)
- **Phone Number**: A dedicated phone number for WhatsApp Business (cannot be used for personal WhatsApp)
- **Facebook Business Account**: Required for WhatsApp Business API
- **Valid Business Information**: Name, address, website (if available)

## Step-by-Step Setup

### 1. Create Facebook Developer Account

1. **Go to Facebook Developers**
   - Visit: https://developers.facebook.com/
   - Click "Get Started" in the top right

2. **Create Developer Account**
   - Log in with your Facebook account (create one if needed)
   - Accept the Developer Terms
   - Verify your account (phone/email verification)

3. **Complete Developer Profile**
   - Add your business information
   - Verify your identity if prompted

### 2. Create a Facebook App

1. **Create New App**
   - Go to https://developers.facebook.com/apps/
   - Click "Create App"
   - Select "Business" as the app type
   - Click "Next"

2. **App Details**
   - **App Name**: "SafetyAI Emergency Notifications" (or similar)
   - **App Contact Email**: Your business email
   - **Business Account**: Select or create a business account
   - Click "Create App"

3. **App Dashboard**
   - You'll be redirected to your app dashboard
   - Note your **App ID** - you'll need this later

### 3. Add WhatsApp Product

1. **Add WhatsApp to Your App**
   - In your app dashboard, scroll down to "Add Products to Your App"
   - Find "WhatsApp" and click "Set up"

2. **WhatsApp Setup**
   - You'll see the WhatsApp setup page
   - Click "Get Started" under WhatsApp Business API

### 4. Set Up WhatsApp Business Account

1. **Business Verification**
   - Click "Create a WhatsApp Business Account"
   - Enter your business information:
     - Business Name: "SafetyAI" (or your app name)
     - Business Category: "Technology" or "Safety Services"
     - Business Description: "Emergency notification service"
     - Business Website: Your website (if available)

2. **Verify Business**
   - Upload business documents if required
   - This process can take 1-3 business days
   - You'll receive email updates on verification status

### 5. Add and Verify Phone Number

1. **Add Phone Number**
   - In WhatsApp setup, click "Add phone number"
   - Enter a phone number you want to use for WhatsApp Business
   - **Important**: This number cannot be used for personal WhatsApp

2. **Verify Phone Number**
   - You'll receive a verification code via SMS or call
   - Enter the verification code
   - The number will be added to your WhatsApp Business account

3. **Get Phone Number ID**
   - Once verified, you'll see your phone number in the dashboard
   - Click on the phone number to see details
   - Copy the **Phone Number ID** - this is what you'll use in your edge function

### 6. Generate Access Token

1. **Temporary Access Token (for testing)**
   - In the WhatsApp setup page, you'll see a temporary access token
   - This token expires in 24 hours - good for initial testing
   - Copy this token for immediate testing

2. **Permanent Access Token (for production)**
   - Go to "System Users" in your Business Manager
   - Create a new system user for your app
   - Assign WhatsApp Business Management permissions
   - Generate a permanent access token

### 7. Configure Webhook (Optional but Recommended)

1. **Set Up Webhook**
   - In WhatsApp configuration, go to "Webhooks"
   - Set Callback URL: `https://your-project.supabase.co/functions/v1/whatsapp-webhook`
   - Set Verify Token: Create a random string (save this for later)
   - Subscribe to message events

2. **Create Webhook Function** (if you want delivery status)
   ```typescript
   // supabase/functions/whatsapp-webhook/index.ts
   Deno.serve(async (req) => {
     const url = new URL(req.url);
     const mode = url.searchParams.get('hub.mode');
     const token = url.searchParams.get('hub.verify_token');
     const challenge = url.searchParams.get('hub.challenge');
     
     const VERIFY_TOKEN = Deno.env.get('WHATSAPP_VERIFY_TOKEN');
     
     if (mode === 'subscribe' && token === VERIFY_TOKEN) {
       return new Response(challenge, { status: 200 });
     }
     
     return new Response('Forbidden', { status: 403 });
   });
   ```

### 8. Configure Environment Variables

Add these to your Supabase Edge Functions environment:

1. **Go to Supabase Dashboard**
   - Project Settings → Edge Functions → Environment Variables

2. **Add Variables**
   ```bash
   WHATSAPP_API_TOKEN=your_access_token_here
   WHATSAPP_PHONE_NUMBER_ID=your_phone_number_id_here
   WHATSAPP_VERIFY_TOKEN=your_webhook_verify_token_here
   ```

### 9. Test Your Setup

1. **Deploy Edge Function**
   ```bash
   supabase functions deploy sos-whatsapp
   ```

2. **Test with Postman or curl**
   ```bash
   curl -X POST https://your-project.supabase.co/functions/v1/sos-whatsapp \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer your_supabase_anon_key" \
     -d '{
       "userId": "test-user",
       "location": {
         "latitude": 37.7749,
         "longitude": -122.4194,
         "formattedAddress": "San Francisco, CA"
       },
       "battery": 85,
       "networkInfo": {
         "type": "wifi",
         "isConnected": true
       }
     }'
   ```

3. **Test in Your App**
   - Add a contact with your WhatsApp number
   - Trigger a test SOS alert
   - Check if you receive the WhatsApp message

## Important Configuration Details

### Phone Number Requirements
- **Dedicated Number**: Cannot be used for personal WhatsApp
- **Business Verification**: Number must be associated with your verified business
- **Country Code**: Always include country code (e.g., +1 for US)
- **Format**: Use international format without spaces or special characters

### Access Token Types
- **Temporary Token**: Expires in 24 hours, good for testing
- **System User Token**: Permanent, required for production
- **User Access Token**: Tied to individual Facebook user, not recommended for apps

### Rate Limits
- **Free Tier**: 1,000 messages per month
- **Paid Tier**: Higher limits available
- **Rate Limiting**: 80 messages per second per phone number

## Production Considerations

### 1. Business Verification
- **Required for Production**: Must have verified business account
- **Documentation**: Business license, tax documents, etc.
- **Timeline**: Can take 1-7 business days

### 2. Message Templates (Optional)
For faster delivery, you can create pre-approved message templates:

1. **Go to Message Templates**
   - In WhatsApp Business Manager
   - Create templates for emergency messages
   - Submit for approval (24-48 hours)

2. **Template Benefits**
   - Faster delivery
   - Higher delivery rates
   - Better formatting options

### 3. Monitoring and Analytics
- **Message Status**: Track delivery, read receipts
- **Analytics**: Monitor message performance
- **Error Handling**: Set up proper error logging

## Troubleshooting

### Common Issues

1. **"Invalid Phone Number" Error**
   - Ensure phone number includes country code
   - Remove spaces, dashes, parentheses
   - Format: +1234567890

2. **"Access Token Invalid" Error**
   - Check if token has expired
   - Verify token has correct permissions
   - Regenerate token if needed

3. **"Phone Number Not Verified" Error**
   - Complete phone number verification process
   - Check business verification status
   - Ensure number isn't used elsewhere

4. **"Rate Limit Exceeded" Error**
   - Implement rate limiting in your code
   - Consider upgrading to paid tier
   - Spread messages over time

### Testing Tips

1. **Start with Test Numbers**
   - Use WhatsApp test numbers for initial testing
   - Add your own number as a test contact

2. **Check Message Format**
   - Ensure message follows WhatsApp formatting rules
   - Test with different message lengths
   - Verify special characters work correctly

3. **Monitor Logs**
   - Check Supabase Edge Function logs
   - Monitor WhatsApp API response codes
   - Set up error alerting

## Cost Considerations

### WhatsApp Business API Pricing
- **Free Tier**: 1,000 conversations per month
- **Paid Tier**: $0.005-$0.009 per message (varies by country)
- **Business Verification**: Free but required for production

### Facebook Business Manager
- **Free**: Basic features and setup
- **Paid Features**: Advanced analytics, higher rate limits

## Security Best Practices

1. **Secure Token Storage**
   - Store access tokens in environment variables
   - Never commit tokens to code repositories
   - Rotate tokens regularly

2. **Webhook Security**
   - Verify webhook signatures
   - Use HTTPS for all webhook URLs
   - Validate incoming data

3. **Rate Limiting**
   - Implement proper rate limiting
   - Monitor for unusual usage patterns
   - Set up alerts for failures

## Next Steps

After completing this setup:

1. **Test Thoroughly**
   - Test with multiple phone numbers
   - Test different message scenarios
   - Verify error handling

2. **Monitor Performance**
   - Set up logging and monitoring
   - Track delivery rates
   - Monitor for errors

3. **Scale Considerations**
   - Plan for increased usage
   - Consider message templates
   - Implement proper error handling

4. **Compliance**
   - Ensure GDPR/privacy compliance
   - Implement opt-out mechanisms
   - Document data handling practices

## Support Resources

- **WhatsApp Business API Documentation**: https://developers.facebook.com/docs/whatsapp
- **Facebook Developer Support**: https://developers.facebook.com/support/
- **WhatsApp Business API Status**: https://developers.facebook.com/status/
- **Community Forums**: Facebook Developer Community

## Conclusion

Setting up WhatsApp Business API requires several steps and business verification, but it provides a reliable way to send emergency notifications. The process typically takes 2-5 business days due to verification requirements.

Once set up, your SafetyAI app will be able to send instant WhatsApp messages to emergency contacts, significantly improving response times during critical situations.

Remember to test thoroughly and monitor your implementation to ensure reliable emergency notifications for your users.