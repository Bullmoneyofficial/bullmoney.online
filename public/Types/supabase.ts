// lib/supabaseClient.ts
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error("Missing Supabase Environment Variables. Check your .env.local file.");
}

export const supabase = createClient(supabaseUrl, supabaseKey);

// --- Type Definitions ---

export interface HeroContent {
  id: number;
  headline: string;
  subheadline: string;
  button_text: string;
  // These fields were missing but exist in your SQL schema:
  beam_text_1: string | null;
  beam_text_2: string | null;
  beam_text_3: string | null;
  updated_at: string;
}

export interface ProjectCard {
  id: number;
  created_at: string;
  title: string;
  description: string | null;
  price: string | null;
  thumbnail: string;
  link: string | null; // Fixed: Database allows nulls (it has a default, but no NOT NULL constraint)
  duration: string | null;
  technique: string | null;
}