-- =====================================================
-- Test Script: Verify User Profile Creation
-- Run this in your Supabase SQL Editor to test the fix
-- =====================================================

-- Check current state
SELECT 'Current State:' as info;

SELECT 
  'Auth Users' as table_name,
  COUNT(*) as count
FROM auth.users
UNION ALL
SELECT 
  'User Profiles' as table_name,
  COUNT(*) as count
FROM public.users;

-- Show any missing profiles
SELECT 'Missing Profiles:' as info;

SELECT 
  au.id,
  au.email,
  au.raw_user_meta_data,
  'Missing Profile' as status
FROM auth.users au
LEFT JOIN public.users pu ON au.id = pu.id
WHERE pu.id IS NULL;

-- Test the trigger function manually
SELECT 'Testing Trigger Function:' as info;

-- This will show if the function exists and is working
SELECT 
  routine_name,
  routine_type,
  data_type
FROM information_schema.routines 
WHERE routine_name = 'handle_new_user' 
AND routine_schema = 'public';

-- Check trigger exists
SELECT 'Checking Trigger:' as info;

SELECT 
  trigger_name,
  event_manipulation,
  event_object_table,
  action_statement
FROM information_schema.triggers 
WHERE trigger_name = 'on_auth_user_created';

-- Show recent user profiles
SELECT 'Recent User Profiles:' as info;

SELECT 
  id,
  email,
  full_name,
  subscription_tier,
  created_at
FROM public.users
ORDER BY created_at DESC
LIMIT 5; 