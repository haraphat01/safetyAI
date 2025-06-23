-- =====================================================
-- SafeGuard AI Database Fix Script
-- Run this in your Supabase SQL Editor to fix user profile creation
-- =====================================================

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Drop existing function if it exists
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Create improved function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert user profile with proper error handling
  INSERT INTO public.users (id, email, full_name)
  VALUES (
    NEW.id, 
    NEW.email, 
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', 'User')
  )
  ON CONFLICT (id) DO NOTHING; -- Prevent duplicate key errors
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically create user profile on signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create a function to manually create user profiles for existing users
CREATE OR REPLACE FUNCTION public.create_missing_user_profiles()
RETURNS void AS $$
DECLARE
  auth_user RECORD;
BEGIN
  -- Loop through all auth users who don't have profiles
  FOR auth_user IN 
    SELECT au.id, au.email, au.raw_user_meta_data
    FROM auth.users au
    LEFT JOIN public.users pu ON au.id = pu.id
    WHERE pu.id IS NULL
  LOOP
    -- Insert missing user profile
    INSERT INTO public.users (id, email, full_name)
    VALUES (
      auth_user.id,
      auth_user.email,
      COALESCE(auth_user.raw_user_meta_data->>'full_name', auth_user.raw_user_meta_data->>'name', 'User')
    )
    ON CONFLICT (id) DO NOTHING;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Execute the function to create profiles for existing users
SELECT public.create_missing_user_profiles();

-- Clean up the temporary function
DROP FUNCTION public.create_missing_user_profiles();

-- =====================================================
-- Verify the fix worked
-- =====================================================

-- Check if all auth users have profiles
SELECT 
  COUNT(*) as total_auth_users,
  (SELECT COUNT(*) FROM public.users) as total_profiles,
  COUNT(*) - (SELECT COUNT(*) FROM public.users) as missing_profiles
FROM auth.users;

-- Show any users still missing profiles (should be 0)
SELECT 
  au.id,
  au.email,
  au.raw_user_meta_data
FROM auth.users au
LEFT JOIN public.users pu ON au.id = pu.id
WHERE pu.id IS NULL; 