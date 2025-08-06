import { createClient } from '@supabase/supabase-js';

// Replace with your Supabase project URL and anon key
const supabaseUrl = 'https://gvrjnswpheayplxvghpi.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd2cmpuc3dwaGVheXBseHZnaHBpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDA2NDM2NDAsImV4cCI6MjA1NjIxOTY0MH0.Lh81sMKRI6G4vBdpXH60N35xthNIl9-lbR-H3xwHxfY';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);