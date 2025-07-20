// Debug script to check RevenueCat configuration
// Run this with: node debug-revenuecat-config.js

const config = require('./app.json');

console.log('=== RevenueCat Configuration Debug ===\n');

console.log('1. Bundle ID:', config.expo.ios?.bundleIdentifier || config.expo.android?.package);
console.log('2. App Name:', config.expo.name);
console.log('3. App Slug:', config.expo.slug);

console.log('\n4. API Keys:');
console.log('   iOS Key:', config.expo.extra?.REVENUECAT_IOS_API_KEY ? 
  config.expo.extra.REVENUECAT_IOS_API_KEY.substring(0, 10) + '...' : 'NOT FOUND');
console.log('   Android Key:', config.expo.extra?.REVENUECAT_ANDROID_API_KEY ? 
  config.expo.extra.REVENUECAT_ANDROID_API_KEY.substring(0, 10) + '...' : 'NOT FOUND');

console.log('\n5. Expected Product IDs:');
console.log('   - safeme_monthly_premium');
console.log('   - safeme_yearly_premium');

console.log('\n=== Next Steps ===');
console.log('1. Verify these Product IDs exist in App Store Connect & Google Play Console');
console.log('2. Verify these Product IDs are added to RevenueCat dashboard');
console.log('3. Verify bundle ID matches in all platforms');
console.log('4. Verify "premium" entitlement exists in RevenueCat');
console.log('5. Verify "default" offering exists with both products');

console.log('\n=== RevenueCat Dashboard URLs ===');
console.log('Products: https://app.revenuecat.com/projects/[your-project]/products');
console.log('Entitlements: https://app.revenuecat.com/projects/[your-project]/entitlements');
console.log('Offerings: https://app.revenuecat.com/projects/[your-project]/offerings');