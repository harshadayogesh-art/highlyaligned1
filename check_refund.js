import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const adminClient = createClient(supabaseUrl, serviceRoleKey);

async function checkRefundPolicy() {
  const { data: legalPages } = await adminClient.from('legal_pages').select('*').eq('slug', 'refund');
  if (legalPages && legalPages.length > 0) {
    console.log(legalPages[0].content);
  }
}

checkRefundPolicy();
