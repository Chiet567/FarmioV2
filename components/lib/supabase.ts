//voila le code 
// lib/supabase.ts
import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";
import "react-native-url-polyfill/auto";

const supabaseUrl = "https://weaycioahsuhucskpozg.supabase.co";
const supabaseAnonKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndlYXljaW9haHN1aHVjc2twb3pnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ1NTI3NzIsImV4cCI6MjA5MDEyODc3Mn0.LcRNXq4Ou-Lfl41C53CuvEDzL6L17PR0sUpBkItSMos";

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false, // Important pour React Native
  },
});

