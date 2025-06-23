import { createClient } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';



// Replace with your actual Supabase URL and anon key


// Custom storage adapter for React Native
const ExpoSecureStoreAdapter = {
  getItem: (key: string) => {
    return SecureStore.getItemAsync(key);
  },
  setItem: (key: string, value: string) => {
    return SecureStore.setItemAsync(key, value);
  },
  removeItem: (key: string) => {
    return SecureStore.deleteItemAsync(key);
  },
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: ExpoSecureStoreAdapter,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// Database types
export interface User {
  id: string;
  email: string;
  full_name: string;
  created_at: string;
  subscription_tier: 'free' | 'premium';
  subscription_status: 'active' | 'inactive' | 'cancelled';
}

export interface EmergencyContact {
  id: string;
  user_id: string;
  name: string;
  phone: string;
  email?: string;
  relationship: string;
  created_at: string;
}

export interface SafetyCheck {
  id: string;
  user_id: string;
  location: {
    latitude: number;
    longitude: number;
  };
  status: 'pending' | 'completed' | 'overdue';
  scheduled_time: string;
  completed_time?: string;
  created_at: string;
}

export interface SOSAlert {
  id: string;
  user_id: string;
  location: {
    latitude: number;
    longitude: number;
  };
  triggered_at: string;
  status: 'active' | 'resolved';
  resolved_at?: string;
  alert_type: 'manual' | 'voice' | 'ai';
}

export interface IncidentLog {
  id: string;
  user_id: string;
  incident_type: string;
  description: string;
  location: {
    latitude: number;
    longitude: number;
  };
  media_urls?: string[];
  created_at: string;
} 