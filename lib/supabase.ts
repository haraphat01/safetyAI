import { createClient } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';

// Supabase configuration
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

// Validate configuration
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase configuration. Please check your environment variables.');
}

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

// Create Supabase client with error handling
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
}

export interface EmergencyContact {
  id: string;
  user_id: string;
  name: string;
  email: string;
  whatsapp: string;
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

// SOSData interface for the sos_data table
export interface SOSData {
  id: string;
  user_id: string;
  sos_alert_id?: string | null;
  audio_url?: string | null;
  audio_filename?: string | null;
  location: {
    latitude: number;
    longitude: number;
    formattedAddress?: string;
    address?: string;
    [key: string]: any;
  };
  battery_level?: number | null;
  network_info?: {
    isWifi?: boolean;
    isConnected?: boolean;
    type?: string;
    [key: string]: any;
  } | null;
  device_info?: any;
  recording_duration?: number | null;
  sent_at: string;
  created_at: string;
  updated_at: string;
} 