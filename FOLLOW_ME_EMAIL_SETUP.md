# Follow Me Email Invite Setup Guide

This guide will help you set up email invites for the Follow Me feature so that contacts receive email notifications when invited to join a tracking session.

## 🚀 Quick Setup

### 1. Deploy the Edge Function

Run the deployment script:

```bash
node scripts/deploy-follow-me-invite.js
```

### 2. Set Environment Variables

In your Supabase Dashboard, go to **Settings > Functions > Environment Variables** and add:

```
RESEND_API_KEY=your_resend_api_key_here
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

### 3. Test the Setup

```bash
node test-follow-me-invite.js
```

## 📧 Email Provider Setup (Resend)

### 1. Create Resend Account
- Go to [resend.com](https://resend.com)
- Sign up for a free account
- Verify your email

### 2. Get API Key
- Go to **API Keys** in your Resend dashboard
- Create a new API key
- Copy the key (starts with `re_`)

### 3. Verify Domain (Optional but Recommended)
- Add your domain to Resend
- This allows you to send from `noreply@yourdomain.com` instead of the default

## 🔧 Manual Deployment

If the deployment script doesn't work, deploy manually:

```bash
# Navigate to supabase directory
cd supabase

# Deploy the function
supabase functions deploy follow-me-invite

# Set environment variables
supabase secrets set RESEND_API_KEY=your_key_here
supabase secrets set SUPABASE_URL=https://your-project-ref.supabase.co
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

## 📋 Prerequisites

### 1. Database Tables
Make sure you've run the Follow Me database schema:

```sql
-- Run this in your Supabase SQL Editor
\i follow-me-table.sql
```

### 2. Emergency Contacts with Email
Contacts must have email addresses to receive invites. Add emails to your emergency contacts:

```sql
-- Example: Update a contact with email
UPDATE emergency_contacts 
SET email = 'friend@example.com' 
WHERE id = 'your-contact-id';
```

### 3. Supabase CLI
Install and configure Supabase CLI:

```bash
npm install -g supabase
supabase login
supabase link --project-ref your-project-ref
```

## 🧪 Testing

### 1. Test Edge Function
```bash
node test-follow-me-invite.js
```

### 2. Test from App
1. Create a Follow Me session in the app
2. Invite a contact with an email address
3. Check the contact's email inbox

### 3. Check Logs
View Edge Function logs in Supabase Dashboard:
- Go to **Functions > follow-me-invite > Logs**

## 📧 Email Template Customization

The email template is in `supabase/functions/follow-me-invite/index.ts`. You can customize:

- **Subject line**: Line 108
- **Email content**: Lines 75-107
- **Styling**: CSS in the HTML template
- **Invite link**: Line 67 (update with your app's URL)

## 🔒 Security Considerations

### 1. Rate Limiting
The Edge Function includes basic error handling but consider adding rate limiting:

```typescript
// Add to the Edge Function
const rateLimit = {
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10 // limit each IP to 10 requests per windowMs
};
```

### 2. Email Validation
The function validates:
- Contact has an email address
- Session exists and is active
- User has permission to invite

### 3. Privacy
- Emails are sent only to emergency contacts
- Invite links include session and participant IDs
- Access is automatically revoked when sessions end

## 🐛 Troubleshooting

### Common Issues

#### 1. "RESEND_API_KEY environment variable is required"
- Check that you've set the environment variable in Supabase Dashboard
- Verify the key is correct and active

#### 2. "Contact does not have an email address"
- Add email addresses to your emergency contacts
- Check the contact record in the database

#### 3. "Session not found"
- Make sure the Follow Me database tables are created
- Verify the session ID is valid

#### 4. "Failed to send email"
- Check Resend dashboard for delivery status
- Verify your domain is properly configured
- Check spam/junk folders

### Debug Steps

1. **Check Function Logs**:
   ```bash
   supabase functions logs follow-me-invite
   ```

2. **Test Function Locally**:
   ```bash
   supabase functions serve follow-me-invite
   ```

3. **Verify Database**:
   ```sql
   -- Check if tables exist
   SELECT table_name FROM information_schema.tables 
   WHERE table_name LIKE 'follow_me%';
   
   -- Check if contacts have emails
   SELECT name, email FROM emergency_contacts WHERE email IS NOT NULL;
   ```

## 📱 App Integration

The FollowMeService automatically calls the Edge Function when inviting participants. No additional app changes are needed.

### Flow:
1. User creates Follow Me session
2. User invites contact
3. `inviteParticipant()` adds participant to database
4. `sendFollowMeInvite()` calls Edge Function
5. Edge Function sends email to contact
6. Contact receives beautiful email with session details

## 🎨 Email Preview

The email includes:
- **Header**: Gradient background with session title
- **Session Details**: Name, description, start time, location
- **Join Button**: Call-to-action to join the journey
- **Features List**: What the contact will see
- **Privacy Note**: Security and privacy information
- **Footer**: App branding and contact info

## 📈 Monitoring

### Track Email Delivery
- Check Resend dashboard for delivery rates
- Monitor bounce rates and spam complaints
- Set up webhooks for delivery events

### Monitor Function Usage
- Check Supabase function logs
- Monitor execution times and errors
- Set up alerts for failures

## 🔄 Updates

To update the Edge Function:

```bash
# Deploy changes
supabase functions deploy follow-me-invite

# Or use the script
node scripts/deploy-follow-me-invite.js
```

## 📞 Support

If you encounter issues:
1. Check the troubleshooting section above
2. Review Supabase function logs
3. Verify all environment variables are set
4. Test with the provided test script

---

**Note**: This feature requires a Resend account and API key. The free tier includes 3,000 emails per month, which should be sufficient for most use cases. 