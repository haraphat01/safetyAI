# RevenueCat Setup Guide for SafeGuard AI

This guide will help you set up RevenueCat subscription management with the specified pricing structure:
- **7-day free trial** for new users
- **$5/month** subscription after trial
- **$55/year** subscription after trial

## 🚀 Quick Setup Steps

### 1. Create RevenueCat Account

1. Go to [RevenueCat Dashboard](https://app.revenuecat.com/)
2. Sign up for a free account
3. Create a new project for SafeGuard AI

### 2. Configure App Store Connect (iOS)

1. **Create In-App Purchases**:
   - Go to App Store Connect → Your App → Features → In-App Purchases
   - Create two Auto-Renewable Subscriptions:

   **Monthly Premium**:
   - Product ID: `safetyai_monthly_premium`
   - Reference Name: `SafeGuard Monthly Premium`
   - Price: $4.99 USD
   - Subscription Duration: 1 Month
   - Free Trial: 7 Days

   **Yearly Premium**:
   - Product ID: `safetyai_yearly_premium`
   - Reference Name: `SafeGuard Yearly Premium`
   - Price: $54.99 USD
   - Subscription Duration: 1 Year
   - Free Trial: 7 Days

2. **Set up Subscription Groups**:
   - Create a subscription group called "SafeGuard Premium"
   - Add both products to this group
   - Set the yearly plan as the preferred plan

### 3. Configure Google Play Console (Android)

1. **Create Subscription Products**:
   - Go to Google Play Console → Your App → Monetize → Products → Subscriptions
   - Create two subscriptions:

   **Monthly Premium**:
   - Product ID: `safetyai_monthly_premium`
   - Name: `SafeGuard Monthly Premium`
   - Price: $4.99 USD
   - Billing Period: 1 Month
   - Free Trial: 7 Days

   **Yearly Premium**:
   - Product ID: `safetyai_yearly_premium`
   - Name: `SafeGuard Yearly Premium`
   - Price: $54.99 USD
   - Billing Period: 1 Year
   - Free Trial: 7 Days

### 4. Configure RevenueCat Dashboard

1. **Add Products**:
   - Go to RevenueCat Dashboard → Your Project → Products
   - Add both products with the same Product IDs as above

2. **Create Entitlement**:
   - Go to Entitlements
   - Create an entitlement called "premium"
   - Add both products to this entitlement

3. **Configure Offerings**:
   - Go to Offerings
   - Create an offering called "default"
   - Add both products to this offering
   - Set the yearly product as "annual" and monthly as "monthly"

### 5. Get API Keys

1. Go to RevenueCat Dashboard → Project Settings → API Keys
2. Copy the API keys for both platforms:
   - **iOS API Key**: `appl_...`
   - **Android API Key**: `goog_...`

### 6. Update App Configuration

1. **Update RevenueCatService.ts**:
   ```typescript
   const REVENUECAT_API_KEYS = {
     ios: 'your_ios_api_key_here',
     android: 'your_android_api_key_here',
   };
   ```

2. **Set up environment variables** (optional):
   ```env
   REVENUECAT_IOS_API_KEY=your_ios_api_key_here
   REVENUECAT_ANDROID_API_KEY=your_android_api_key_here
   ```

### 7. Run Database Setup

1. Go to your Supabase Dashboard → SQL Editor
2. Run the contents of `subscription-setup.sql`

### 8. Test the Integration

1. **Build and run the app**:
   ```bash
   npx expo run:ios
   # or
   npx expo run:android
   ```

2. **Test subscription flow**:
   - Go to Profile → Subscription
   - Try to purchase a subscription
   - Verify trial period starts
   - Check subscription status updates

## 🔧 Advanced Configuration

### Webhook Setup (Optional but Recommended)

1. **Create RevenueCat Webhook**:
   - Go to RevenueCat Dashboard → Project Settings → Webhooks
   - Add webhook URL: `https://your-project.supabase.co/functions/v1/revenuecat-webhook`
   - Select events: `INITIAL_PURCHASE`, `RENEWAL`, `CANCELLATION`, `TRIAL_STARTED`, `TRIAL_CONVERTED`

2. **Create Supabase Edge Function**:
   ```bash
   supabase functions new revenuecat-webhook
   ```

3. **Implement webhook handler** (see example below)

### Subscription Analytics

1. **RevenueCat Analytics**:
   - Go to RevenueCat Dashboard → Analytics
   - Monitor conversion rates, churn, and revenue

2. **Custom Analytics**:
   - Use the `subscription_history` table for custom reporting
   - Track trial-to-paid conversion rates

## 📱 App Store Guidelines

### iOS Guidelines

1. **Subscription Terms**:
   - Clearly state trial period and pricing
   - Provide easy cancellation instructions
   - Include subscription terms in app

2. **UI Requirements**:
   - Show subscription status clearly
   - Provide restore purchases option
   - Display subscription expiration dates

### Android Guidelines

1. **Billing Requirements**:
   - Implement proper billing flow
   - Handle billing errors gracefully
   - Provide subscription management

2. **Play Store Policies**:
   - Follow subscription policies
   - Provide clear pricing information
   - Handle subscription state changes

## 🧪 Testing

### Sandbox Testing

1. **iOS Sandbox**:
   - Use sandbox Apple IDs
   - Test trial periods and renewals
   - Verify receipt validation

2. **Android Testing**:
   - Use test accounts
   - Test subscription flows
   - Verify purchase verification

### Test Scenarios

1. **New User Flow**:
   - Sign up → Start trial → Verify trial status
   - Trial expiration → Subscription activation
   - Payment failure handling

2. **Existing User Flow**:
   - Restore purchases
   - Subscription renewal
   - Cancellation and reactivation

## 🔒 Security Considerations

1. **API Key Security**:
   - Never commit API keys to version control
   - Use environment variables
   - Rotate keys regularly

2. **Receipt Validation**:
   - RevenueCat handles this automatically
   - Verify entitlements on app launch
   - Handle offline scenarios

3. **User Privacy**:
   - Follow GDPR/CCPA requirements
   - Provide data export/deletion
   - Secure user data transmission

## 📊 Monitoring & Analytics

### Key Metrics to Track

1. **Conversion Metrics**:
   - Trial-to-paid conversion rate
   - Monthly recurring revenue (MRR)
   - Customer lifetime value (CLV)

2. **Retention Metrics**:
   - Monthly churn rate
   - Subscription renewal rate
   - Trial completion rate

3. **Revenue Metrics**:
   - Average revenue per user (ARPU)
   - Revenue growth rate
   - Subscription revenue breakdown

### RevenueCat Dashboard

1. **Real-time Analytics**:
   - Live subscription data
   - Revenue tracking
   - User behavior insights

2. **Automated Reports**:
   - Daily/weekly/monthly reports
   - Email notifications
   - Custom dashboards

## 🚨 Troubleshooting

### Common Issues

1. **Products Not Loading**:
   - Check Product IDs match exactly
   - Verify products are approved in App Store/Play Store
   - Check RevenueCat configuration

2. **Purchase Failures**:
   - Verify sandbox/test accounts
   - Check network connectivity
   - Review error logs

3. **Subscription Status Issues**:
   - Check RevenueCat dashboard
   - Verify webhook configuration
   - Review database logs

### Debug Steps

1. **Enable Debug Logs**:
   ```typescript
   Purchases.setLogLevel(Purchases.LOG_LEVEL.DEBUG);
   ```

2. **Check RevenueCat Dashboard**:
   - User management
   - Purchase history
   - Entitlement status

3. **Verify Database**:
   ```sql
   SELECT * FROM subscription_history WHERE user_id = 'your_user_id';
   SELECT * FROM users WHERE id = 'your_user_id';
   ```

## 📞 Support

- **RevenueCat Documentation**: [docs.revenuecat.com](https://docs.revenuecat.com/)
- **RevenueCat Support**: [support.revenuecat.com](https://support.revenuecat.com/)
- **App Store Connect Help**: [help.apple.com](https://help.apple.com/app-store-connect/)
- **Google Play Console Help**: [support.google.com](https://support.google.com/googleplay/android-developer/)

---

**Note**: This setup assumes you have already configured your app for App Store and Google Play Store distribution. Make sure to follow platform-specific guidelines and requirements. 