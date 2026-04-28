import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://hjbihxkuetcdivntxiym.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhqYmloeGt1ZXRjZGl2bnR4aXltIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NzE3NTQ2MSwiZXhwIjoyMDkyNzUxNDYxfQ.rHCpqTgziRCrEWUEu-TW5OOibEtpZahMbmthFxPKdtE';

const adminClient = createClient(supabaseUrl, serviceRoleKey);

async function addSettings() {
  const settingsToAdd = [
    { key: 'gst_enabled', value: { enabled: false } },
    { key: 'business_info', value: { name: 'HighlyAligned', owner: 'Harshada Yogesh', phone: '+91 84688 83571', email: 'harshada@highlyaligned.in', address: 'Navrangpura, Ahmedabad, Gujarat, India' } },
    { key: 'footer_config', value: { name: 'HighlyAligned', address: 'Navrangpura, Ahmedabad', email: 'harshada@highlyaligned.in', phone: '+91 84688 83571', tagline: 'Align Your Energy', show_newsletter: true } },
    { key: 'social_links', value: { instagram: '', facebook: '', youtube: '', whatsapp: '+918468883571', twitter: '', linkedin: '' } },
    { key: 'cloudinary_config', value: { cloud_name: '', api_key: '', upload_preset: 'highlyaligned_unsigned', folder: 'highlyaligned' } },
    { key: 'hero_images', value: { desktop: '', mobile: '', alt: 'HighlyAligned' } },
    { key: 'gemini_config', value: { provider: 'gemini', api_key: '', model: 'gemini-1.5-flash', temperature: 0.7, max_tokens: 1024, default_language: 'english' } },
    { key: 'logo_config', value: { logo_url: '', favicon_url: '' } }
  ];

  for (const setting of settingsToAdd) {
    const { error } = await adminClient.from('settings').upsert(setting);
    if (error) {
      console.log(`❌ Error adding ${setting.key}: ${error.message}`);
    } else {
      console.log(`✅ Added setting: ${setting.key}`);
    }
  }
}

addSettings();
