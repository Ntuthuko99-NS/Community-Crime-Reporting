import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type User = {
  id: string;
  email: string;
  full_name: string;
  role: 'resident' | 'police_officer';
  location_lat?: number;
  location_lng?: number;
  phone_number?: string;
  created_at: string;
  updated_at: string;
};

export type Incident = {
  id: string;
  reporter_id: string;
  type: string;
  description: string;
  location_lat: number;
  location_lng: number;
  location_address?: string;
  status: 'pending' | 'verified' | 'reported_to_saps' | 'resolved';
  severity: 'low' | 'medium' | 'high' | 'critical';
  timestamp: string;
  created_at: string;
  updated_at: string;
};

export type Hotspot = {
  id: string;
  location_lat: number;
  location_lng: number;
  radius_meters: number;
  crime_count: number;
  severity_score: number;
  dominant_crime_type?: string;
  last_updated: string;
  created_at: string;
};

export type Alert = {
  id: string;
  user_id: string;
  incident_id?: string;
  hotspot_id?: string;
  title: string;
  message: string;
  alert_type: 'incident' | 'hotspot' | 'community';
  is_read: boolean;
  created_at: string;
};

export type NeighbourhoodWatchGroup = {
  id: string;
  name: string;
  description?: string;
  location_lat: number;
  location_lng: number;
  coverage_radius_meters: number;
  created_by: string;
  created_at: string;
  updated_at: string;
};
