-- Subscription Setup for SafeGuard AI with RevenueCat Integration
-- Run this in your Supabase SQL Editor

-- Update users table to include subscription fields
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS subscription_tier TEXT DEFAULT 'free',
ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'inactive',
ADD COLUMN IF NOT EXISTS subscription_expires_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS trial_started_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS revenuecat_user_id TEXT,
ADD COLUMN IF NOT EXISTS last_subscription_check TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Create subscription history table
CREATE TABLE IF NOT EXISTS public.subscription_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  subscription_tier TEXT NOT NULL,
  subscription_status TEXT NOT NULL,
  revenuecat_transaction_id TEXT,
  revenuecat_product_id TEXT,
  revenuecat_entitlement_id TEXT,
  price_amount DECIMAL(10,2),
  price_currency TEXT DEFAULT 'USD',
  trial_started_at TIMESTAMP WITH TIME ZONE,
  trial_ends_at TIMESTAMP WITH TIME ZONE,
  subscription_started_at TIMESTAMP WITH TIME ZONE,
  subscription_expires_at TIMESTAMP WITH TIME ZONE,
  cancelled_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create subscription products table
CREATE TABLE IF NOT EXISTS public.subscription_products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id TEXT UNIQUE NOT NULL,
  product_name TEXT NOT NULL,
  product_type TEXT NOT NULL, -- 'monthly', 'yearly'
  price_amount DECIMAL(10,2) NOT NULL,
  price_currency TEXT DEFAULT 'USD',
  trial_days INTEGER DEFAULT 7,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default subscription products
INSERT INTO public.subscription_products (product_id, product_name, product_type, price_amount, trial_days) 
VALUES 
  ('safetyai_monthly_premium', 'SafeGuard Monthly Premium', 'monthly', 5.00, 7),
  ('safetyai_yearly_premium', 'SafeGuard Yearly Premium', 'yearly', 55.00, 7)
ON CONFLICT (product_id) DO NOTHING;

-- Create subscription entitlements table
CREATE TABLE IF NOT EXISTS public.subscription_entitlements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  entitlement_id TEXT NOT NULL,
  entitlement_name TEXT NOT NULL,
  is_active BOOLEAN DEFAULT false,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_subscription_tier ON public.users(subscription_tier);
CREATE INDEX IF NOT EXISTS idx_users_subscription_status ON public.users(subscription_status);
CREATE INDEX IF NOT EXISTS idx_users_revenuecat_user_id ON public.users(revenuecat_user_id);
CREATE INDEX IF NOT EXISTS idx_subscription_history_user_id ON public.subscription_history(user_id);
CREATE INDEX IF NOT EXISTS idx_subscription_history_created_at ON public.subscription_history(created_at);
CREATE INDEX IF NOT EXISTS idx_subscription_entitlements_user_id ON public.subscription_entitlements(user_id);
CREATE INDEX IF NOT EXISTS idx_subscription_entitlements_is_active ON public.subscription_entitlements(is_active);

-- Enable Row Level Security
ALTER TABLE public.subscription_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_entitlements ENABLE ROW LEVEL SECURITY;

-- RLS Policies for subscription_history
CREATE POLICY "Users can view their own subscription history" ON public.subscription_history
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage subscription history" ON public.subscription_history
  FOR ALL USING (auth.role() = 'service_role');

-- RLS Policies for subscription_products
CREATE POLICY "Anyone can view active subscription products" ON public.subscription_products
  FOR SELECT USING (is_active = true);

CREATE POLICY "Service role can manage subscription products" ON public.subscription_products
  FOR ALL USING (auth.role() = 'service_role');

-- RLS Policies for subscription_entitlements
CREATE POLICY "Users can view their own entitlements" ON public.subscription_entitlements
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage entitlements" ON public.subscription_entitlements
  FOR ALL USING (auth.role() = 'service_role');

-- Function to update user subscription status
CREATE OR REPLACE FUNCTION update_user_subscription(
  p_user_id UUID,
  p_tier TEXT,
  p_status TEXT,
  p_expires_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
  p_trial_started_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
  p_trial_ends_at TIMESTAMP WITH TIME ZONE DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
  UPDATE public.users 
  SET 
    subscription_tier = p_tier,
    subscription_status = p_status,
    subscription_expires_at = p_expires_at,
    trial_started_at = p_trial_started_at,
    trial_ends_at = p_trial_ends_at,
    last_subscription_check = NOW()
  WHERE id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to log subscription event
CREATE OR REPLACE FUNCTION log_subscription_event(
  p_user_id UUID,
  p_tier TEXT,
  p_status TEXT,
  p_revenuecat_transaction_id TEXT DEFAULT NULL,
  p_revenuecat_product_id TEXT DEFAULT NULL,
  p_revenuecat_entitlement_id TEXT DEFAULT NULL,
  p_price_amount DECIMAL(10,2) DEFAULT NULL,
  p_trial_started_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
  p_trial_ends_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
  p_subscription_started_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
  p_subscription_expires_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
  p_cancelled_at TIMESTAMP WITH TIME ZONE DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_history_id UUID;
BEGIN
  INSERT INTO public.subscription_history (
    user_id,
    subscription_tier,
    subscription_status,
    revenuecat_transaction_id,
    revenuecat_product_id,
    revenuecat_entitlement_id,
    price_amount,
    trial_started_at,
    trial_ends_at,
    subscription_started_at,
    subscription_expires_at,
    cancelled_at
  ) VALUES (
    p_user_id,
    p_tier,
    p_status,
    p_revenuecat_transaction_id,
    p_revenuecat_product_id,
    p_revenuecat_entitlement_id,
    p_price_amount,
    p_trial_started_at,
    p_trial_ends_at,
    p_subscription_started_at,
    p_subscription_expires_at,
    p_cancelled_at
  ) RETURNING id INTO v_history_id;
  
  RETURN v_history_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user has active premium subscription
CREATE OR REPLACE FUNCTION has_active_premium_subscription(p_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_has_premium BOOLEAN;
BEGIN
  SELECT 
    subscription_tier = 'premium' AND 
    (subscription_status = 'active' OR subscription_status = 'trial') AND
    (subscription_expires_at IS NULL OR subscription_expires_at > NOW())
  INTO v_has_premium
  FROM public.users 
  WHERE id = p_user_id;
  
  RETURN COALESCE(v_has_premium, false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get subscription info for a user
CREATE OR REPLACE FUNCTION get_user_subscription_info(p_user_id UUID)
RETURNS TABLE(
  tier TEXT,
  status TEXT,
  expires_at TIMESTAMP WITH TIME ZONE,
  trial_started_at TIMESTAMP WITH TIME ZONE,
  trial_ends_at TIMESTAMP WITH TIME ZONE,
  is_trial BOOLEAN,
  is_active BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    u.subscription_tier,
    u.subscription_status,
    u.subscription_expires_at,
    u.trial_started_at,
    u.trial_ends_at,
    u.subscription_status = 'trial' AS is_trial,
    (u.subscription_tier = 'premium' AND 
     (u.subscription_status = 'active' OR u.subscription_status = 'trial') AND
     (u.subscription_expires_at IS NULL OR u.subscription_expires_at > NOW())) AS is_active
  FROM public.users u
  WHERE u.id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT EXECUTE ON FUNCTION update_user_subscription(UUID, TEXT, TEXT, TIMESTAMP WITH TIME ZONE, TIMESTAMP WITH TIME ZONE, TIMESTAMP WITH TIME ZONE) TO authenticated;
GRANT EXECUTE ON FUNCTION log_subscription_event(UUID, TEXT, TEXT, TEXT, TEXT, TEXT, DECIMAL, TIMESTAMP WITH TIME ZONE, TIMESTAMP WITH TIME ZONE, TIMESTAMP WITH TIME ZONE, TIMESTAMP WITH TIME ZONE, TIMESTAMP WITH TIME ZONE) TO authenticated;
GRANT EXECUTE ON FUNCTION has_active_premium_subscription(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_subscription_info(UUID) TO authenticated;

-- Grant all permissions to service role
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO service_role; 