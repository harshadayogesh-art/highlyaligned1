import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://hjbihxkuetcdivntxiym.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhqYmloeGt1ZXRjZGl2bnR4aXltIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NzE3NTQ2MSwiZXhwIjoyMDkyNzUxNDYxfQ.rHCpqTgziRCrEWUEu-TW5OOibEtpZahMbmthFxPKdtE';
const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhqYmloeGt1ZXRjZGl2bnR4aXltIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcxNzU0NjEsImV4cCI6MjA5Mjc1MTQ2MX0.C_bWggEyNPMVLGDEIAyTI8UGScu3ehxTrsxAAHh0qpg';

const adminClient = createClient(supabaseUrl, serviceRoleKey);
const anonClient = createClient(supabaseUrl, anonKey);

const tables = [
  'profiles', 'settings', 'categories', 'products', 'services', 
  'orders', 'order_items', 'bookings', 'remedies', 'remedy_logs', 
  'leads', 'lead_magnet_areas', 'referrals', 'coupons', 'banners', 
  'pages', 'blog_posts', 'legal_pages'
];

async function verify() {
  console.log("--- TABLE VERIFICATION ---");
  for (const table of tables) {
    const { error } = await adminClient.from(table).select('*').limit(1);
    if (error) {
      console.log(`❌ Table ${table} missing or error: ${error.message}`);
    } else {
      console.log(`✅ Table ${table} exists`);
    }
  }

  console.log("\n--- SETTINGS KEYS VERIFICATION ---");
  const { data: settingsData, error: settingsError } = await adminClient.from('settings').select('key');
  if (settingsError) {
    console.log(`❌ Settings error: ${settingsError.message}`);
  } else {
    const existingKeys = settingsData.map(s => s.key);
    const requiredKeys = ['gst_enabled', 'business_info', 'footer_config', 'social_links', 'cloudinary_config', 'hero_images', 'gemini_config', 'logo_config'];
    
    for (const reqKey of requiredKeys) {
      if (existingKeys.includes(reqKey)) {
        console.log(`✅ Setting ${reqKey} exists`);
      } else {
        console.log(`❌ Setting ${reqKey} MISSING`);
      }
    }
  }

  console.log("\n--- RLS VERIFICATION (ANON) ---");
  const { error: leadsError } = await anonClient.from('leads').select('*').limit(1);
  if (leadsError) {
    console.log(`✅ Leads RLS blocks anon: ${leadsError.message}`);
  } else {
    console.log(`❌ Leads RLS FAILED to block anon (or table empty)`);
  }
}

verify();
