-- Add missing columns to profiles table for analytics and theme preferences
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS app_theme text DEFAULT 'system',
ADD COLUMN IF NOT EXISTS onboarding_completed boolean DEFAULT false;
