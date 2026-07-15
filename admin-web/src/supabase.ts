import { createClient } from '@supabase/supabase-js';

const DEFAULT_URL = import.meta.env.EXPO_PUBLIC_SUPABASE_URL || '';
const DEFAULT_ANON_KEY = import.meta.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

const STORAGE_KEY_ROLE = 'ehliyet_admin_service_role_key';
const STORAGE_KEY_URL = 'ehliyet_admin_supabase_url';

export const getServiceRoleKey = () => localStorage.getItem(STORAGE_KEY_ROLE) || '';
export const getCustomSupabaseUrl = () => localStorage.getItem(STORAGE_KEY_URL) || '';

export const setCredentials = (url: string, serviceRoleKey: string) => {
  localStorage.setItem(STORAGE_KEY_URL, url);
  localStorage.setItem(STORAGE_KEY_ROLE, serviceRoleKey);
  window.location.reload();
};

export const clearCredentials = () => {
  localStorage.removeItem(STORAGE_KEY_URL);
  localStorage.removeItem(STORAGE_KEY_ROLE);
  window.location.reload();
};

const activeUrl = getCustomSupabaseUrl() || DEFAULT_URL;
const activeKey = getServiceRoleKey() || DEFAULT_ANON_KEY;

export const isConfigured = !!activeUrl && !!activeKey;
export const isUsingServiceRole = !!getServiceRoleKey();

export const supabase = createClient(activeUrl || 'https://placeholder.supabase.co', activeKey || 'placeholder', {
  auth: {
    persistSession: false,
  }
});
