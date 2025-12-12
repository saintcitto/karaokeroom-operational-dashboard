import { createClient } from "@supabase/supabase-js";

const supabaseUrl = 'https://lweccpjfvprvsjebxvts.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx3ZWNjcGpmdnBydnNqZWJ4dnRzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM2OTQyODcsImV4cCI6MjA3OTI3MDI4N30.kb0TVdhbF3RiMLSZieQ1aoMWad5V3ynSZLUQnC7TwkA';

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY in environment");
}
;
export const supabase = createClient(supabaseUrl, supabaseKey);