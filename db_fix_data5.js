import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const adminClient = createClient(supabaseUrl, serviceRoleKey);

async function fixRefundPolicy() {
  console.log('Fixing refund policy in Supabase...');
  const { data: legalPages } = await adminClient.from('legal_pages').select('*').eq('slug', 'refund');
  
  if (legalPages) {
    for (const page of legalPages) {
      let updated = false;
      let newContent = page.content;

      if (newContent.includes('- Perishable goods.')) {
        newContent = newContent.replace(/- Perishable goods.\n/g, '');
        updated = true;
      } else if (newContent.includes('Perishable goods.')) {
        newContent = newContent.replace(/Perishable goods./g, '');
        updated = true;
      }

      if (updated) {
        await adminClient.from('legal_pages').update({ content: newContent }).eq('id', page.id);
        console.log(`Updated legal_pages: ${page.slug}`);
      }
    }
  }
}

fixRefundPolicy();
