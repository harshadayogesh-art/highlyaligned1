import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const adminClient = createClient(supabaseUrl, serviceRoleKey);

async function fixRefundPolicy() {
  const { data: legalPages } = await adminClient.from('legal_pages').select('*').eq('slug', 'refund');
  if (legalPages && legalPages.length > 0) {
    let content = legalPages[0].content;
    // Replace handling carriage returns and newlines
    content = content.replace(/- Perishable goods.\r?\n/g, '');
    
    // Also try without newline just in case
    content = content.replace(/- Perishable goods./g, '');
    
    await adminClient.from('legal_pages').update({ content }).eq('slug', 'refund');
    console.log('Fixed DB!');
  }
}

fixRefundPolicy();
