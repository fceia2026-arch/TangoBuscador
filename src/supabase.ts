import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = (import.meta as any).env.VITE_SUPABASE_URL || 'https://kwhllwbpdvgwyosgerqb.supabase.co';
const SUPABASE_KEY = (import.meta as any).env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt3aGxsd2JwZHZnd3lvc2dlcnFiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE3NDE5OTUsImV4cCI6MjA5NzMxNzk5NX0.w4-OE8DTZ0Wl1jixcl6Z_1SxoenXauGs8mCK969IgyQ';

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
