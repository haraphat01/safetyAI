import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

interface RevenueCatEvent {
  api_version: string;
  event: {
    type: string;
    id: string;
    app_user_id: string;
    aliases: string[];
    original_app_user_id: string;
    product_id: string;
    period_type: string;
    purchased_at_ms: number;
    expiration_at_ms: number;
    environment: string;
    entitlement_id: string;
    entitlement_ids: string[];
    presented_offering_id: string;
    transaction_id: string;
    original_transaction_id: string;
    is_family_share: boolean;
    country_code: string;
    app_id: string;
    offer_code: string;
    price: number;
    currency: string;
    subscriber_attributes: Record<string, any>;
    store: string;
    takehome_percentage: number;
    commission_percentage: number;
    is_trial_conversion: boolean;
    cancel_reason: string;
    expiration_reason: string;
  };
}

Deno.serve(async (req) => {
  try {
    // Verify request method
    if (req.method !== 'POST') {
      return new Response('Method not allowed', { status: 405 });
    }

    // Parse the webhook payload
    const event: RevenueCatEvent = await req.json();
    
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      console.error('Missing Supabase configuration');
      return new Response('Internal server error', { status: 500 });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Extract event data
    const {
      type: eventType,
      app_user_id: revenueCatUserId,
      product_id: productId,
      period_type: periodType,
      purchased_at_ms: purchasedAtMs,
      expiration_at_ms: expirationAtMs,
      entitlement_id: entitlementId,
      transaction_id: transactionId,
      price,
      currency,
      store,
      is_trial_conversion: isTrialConversion,
      cancel_reason: cancelReason,
      expiration_reason: expirationReason
    } = event.event;

    console.log('RevenueCat webhook received:', {
      eventType,
      revenueCatUserId,
      productId,
      periodType,
      transactionId
    });

    // Find user by RevenueCat user ID
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('revenuecat_user_id', revenueCatUserId)
      .single();

    if (userError || !user) {
      console.error('User not found for RevenueCat user ID:', revenueCatUserId);
      return new Response('User not found', { status: 404 });
    }

    const userId = user.id;
    const purchasedAt = new Date(purchasedAtMs);
    const expiresAt = expirationAtMs ? new Date(expirationAtMs) : null;
    const isTrial = periodType === 'trial';

    // Handle different event types
    switch (eventType) {
      case 'INITIAL_PURCHASE':
      case 'RENEWAL':
        await handlePurchaseEvent(supabase, {
          userId,
          eventType,
          productId,
          isTrial,
          purchasedAt,
          expiresAt,
          transactionId,
          entitlementId,
          price,
          currency,
          store,
          isTrialConversion
        });
        break;

      case 'CANCELLATION':
        await handleCancellationEvent(supabase, {
          userId,
          productId,
          transactionId,
          cancelReason
        });
        break;

      case 'TRIAL_STARTED':
        await handleTrialStartedEvent(supabase, {
          userId,
          productId,
          purchasedAt,
          expiresAt,
          transactionId,
          entitlementId
        });
        break;

      case 'TRIAL_CONVERTED':
        await handleTrialConvertedEvent(supabase, {
          userId,
          productId,
          purchasedAt,
          expiresAt,
          transactionId,
          entitlementId,
          price,
          currency
        });
        break;

      case 'EXPIRATION':
        await handleExpirationEvent(supabase, {
          userId,
          productId,
          expirationReason
        });
        break;

      default:
        console.log('Unhandled event type:', eventType);
    }

    return new Response('OK', { status: 200 });

  } catch (error) {
    console.error('Webhook processing error:', error);
    return new Response('Internal server error', { status: 500 });
  }
});

async function handlePurchaseEvent(supabase: any, data: {
  userId: string;
  eventType: string;
  productId: string;
  isTrial: boolean;
  purchasedAt: Date;
  expiresAt: Date | null;
  transactionId: string;
  entitlementId: string;
  price: number;
  currency: string;
  store: string;
  isTrialConversion: boolean;
}) {
  const {
    userId,
    eventType,
    productId,
    isTrial,
    purchasedAt,
    expiresAt,
    transactionId,
    entitlementId,
    price,
    currency,
    store,
    isTrialConversion
  } = data;

  // Update user subscription status
  const subscriptionStatus = isTrial ? 'trial' : 'active';
  const subscriptionTier = 'premium';

  await supabase.rpc('update_user_subscription', {
    p_user_id: userId,
    p_tier: subscriptionTier,
    p_status: subscriptionStatus,
    p_expires_at: expiresAt,
    p_trial_started_at: isTrial ? purchasedAt : null,
    p_trial_ends_at: isTrial ? expiresAt : null
  });

  // Log subscription event
  await supabase.rpc('log_subscription_event', {
    p_user_id: userId,
    p_tier: subscriptionTier,
    p_status: subscriptionStatus,
    p_revenuecat_transaction_id: transactionId,
    p_revenuecat_product_id: productId,
    p_revenuecat_entitlement_id: entitlementId,
    p_price_amount: price,
    p_trial_started_at: isTrial ? purchasedAt : null,
    p_trial_ends_at: isTrial ? expiresAt : null,
    p_subscription_started_at: !isTrial ? purchasedAt : null,
    p_subscription_expires_at: !isTrial ? expiresAt : null
  });

  // Update or create entitlement record
  await supabase
    .from('subscription_entitlements')
    .upsert({
      user_id: userId,
      entitlement_id: entitlementId,
      entitlement_name: 'premium',
      is_active: true,
      expires_at: expiresAt,
      updated_at: new Date().toISOString()
    }, {
      onConflict: 'user_id,entitlement_id'
    });

  console.log(`Subscription ${eventType} processed for user ${userId}`);
}

async function handleCancellationEvent(supabase: any, data: {
  userId: string;
  productId: string;
  transactionId: string;
  cancelReason: string;
}) {
  const { userId, productId, transactionId, cancelReason } = data;

  // Update user subscription status
  await supabase.rpc('update_user_subscription', {
    p_user_id: userId,
    p_tier: 'free',
    p_status: 'cancelled'
  });

  // Log cancellation event
  await supabase.rpc('log_subscription_event', {
    p_user_id: userId,
    p_tier: 'free',
    p_status: 'cancelled',
    p_revenuecat_transaction_id: transactionId,
    p_revenuecat_product_id: productId,
    p_cancelled_at: new Date()
  });

  // Deactivate entitlements
  await supabase
    .from('subscription_entitlements')
    .update({
      is_active: false,
      updated_at: new Date().toISOString()
    })
    .eq('user_id', userId);

  console.log(`Subscription cancelled for user ${userId}`);
}

async function handleTrialStartedEvent(supabase: any, data: {
  userId: string;
  productId: string;
  purchasedAt: Date;
  expiresAt: Date | null;
  transactionId: string;
  entitlementId: string;
}) {
  const { userId, productId, purchasedAt, expiresAt, transactionId, entitlementId } = data;

  // Update user subscription status
  await supabase.rpc('update_user_subscription', {
    p_user_id: userId,
    p_tier: 'premium',
    p_status: 'trial',
    p_trial_started_at: purchasedAt,
    p_trial_ends_at: expiresAt
  });

  // Log trial started event
  await supabase.rpc('log_subscription_event', {
    p_user_id: userId,
    p_tier: 'premium',
    p_status: 'trial',
    p_revenuecat_transaction_id: transactionId,
    p_revenuecat_product_id: productId,
    p_revenuecat_entitlement_id: entitlementId,
    p_trial_started_at: purchasedAt,
    p_trial_ends_at: expiresAt
  });

  console.log(`Trial started for user ${userId}`);
}

async function handleTrialConvertedEvent(supabase: any, data: {
  userId: string;
  productId: string;
  purchasedAt: Date;
  expiresAt: Date | null;
  transactionId: string;
  entitlementId: string;
  price: number;
  currency: string;
}) {
  const { userId, productId, purchasedAt, expiresAt, transactionId, entitlementId, price, currency } = data;

  // Update user subscription status
  await supabase.rpc('update_user_subscription', {
    p_user_id: userId,
    p_tier: 'premium',
    p_status: 'active',
    p_expires_at: expiresAt
  });

  // Log trial conversion event
  await supabase.rpc('log_subscription_event', {
    p_user_id: userId,
    p_tier: 'premium',
    p_status: 'active',
    p_revenuecat_transaction_id: transactionId,
    p_revenuecat_product_id: productId,
    p_revenuecat_entitlement_id: entitlementId,
    p_price_amount: price,
    p_subscription_started_at: purchasedAt,
    p_subscription_expires_at: expiresAt
  });

  console.log(`Trial converted for user ${userId}`);
}

async function handleExpirationEvent(supabase: any, data: {
  userId: string;
  productId: string;
  expirationReason: string;
}) {
  const { userId, productId, expirationReason } = data;

  // Update user subscription status
  await supabase.rpc('update_user_subscription', {
    p_user_id: userId,
    p_tier: 'free',
    p_status: 'inactive'
  });

  // Log expiration event
  await supabase.rpc('log_subscription_event', {
    p_user_id: userId,
    p_tier: 'free',
    p_status: 'inactive',
    p_revenuecat_product_id: productId
  });

  // Deactivate entitlements
  await supabase
    .from('subscription_entitlements')
    .update({
      is_active: false,
      updated_at: new Date().toISOString()
    })
    .eq('user_id', userId);

  console.log(`Subscription expired for user ${userId}`);
} 