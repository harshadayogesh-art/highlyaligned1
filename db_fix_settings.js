import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY env vars');
  process.exit(1);
}

const adminClient = createClient(supabaseUrl, serviceRoleKey);

async function addSettings() {
  const settingsToAdd = [
    { key: 'gst_enabled', value: { enabled: false } },
    { key: 'business_info', value: { name: 'Selfaligned', owner: 'Harshada Yogesh', phone: '+91 84688 83571', email: 'self.aligned1111@gmail.com', address: 'Pimpri-Chinchwad, Maharashtra, India' } },
    { key: 'footer_config', value: { name: 'Selfaligned', address: 'Pimpri-Chinchwad, Maharashtra, India', email: 'self.aligned1111@gmail.com', phone: '+91 84688 83571', tagline: 'Align Your Energy', show_newsletter: true } },
    { key: 'social_links', value: { instagram: '', facebook: '', youtube: '', whatsapp: '+918468883571', twitter: '', linkedin: '' } },
    { key: 'cloudinary_config', value: { cloud_name: '', api_key: '', upload_preset: 'Selfaligned_unsigned', folder: 'Selfaligned' } },
    { key: 'hero_images', value: { desktop: '', mobile: '', alt: 'Selfaligned' } },
    { key: 'gemini_config', value: { provider: 'gemini', api_key: '', model: 'gemini-1.5-flash', temperature: 0.7, max_tokens: 1024, default_language: 'english' } },
    { key: 'logo_config', value: { logo_url: '', favicon_url: '' } }
  ];

  for (const setting of settingsToAdd) {
    const { error } = await adminClient.from('settings').upsert(setting, { onConflict: 'key' });
    if (error) {
      console.log(`❌ Error adding ${setting.key}: ${error.message}`);
    } else {
      console.log(`✅ Added setting: ${setting.key}`);
    }
  }
}

addSettings();
