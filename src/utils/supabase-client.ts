import { createClient } from '@supabase/supabase-js';

// Create a fresh Supabase client without corrupted types
const supabaseUrl = 'https://xvkxccqaopbnkvwgyfjv.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh2a3hjY3Fhb3Bibmt2d2d5Zmp2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc4MjMwMTIsImV4cCI6MjA2MzM5OTAxMn0.z9UkKHDm4RPMs_2IIzEPEYzd3-sbQSF6XpxaQg3vZhU';

export const supabaseClient = createClient(supabaseUrl, supabaseKey);

// Export for easy import
export default supabaseClient;