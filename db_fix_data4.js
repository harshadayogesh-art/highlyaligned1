import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const adminClient = createClient(supabaseUrl, serviceRoleKey);

async function fixLegalPages() {
  console.log('Fixing legal pages in Supabase...');
  const { data: legalPages } = await adminClient.from('legal_pages').select('*');
  
  if (legalPages) {
    for (const page of legalPages) {
      let updated = false;
      let newContent = page.content;

      // 4. Add GSTIN to Terms page
      if (page.slug === 'terms' && !newContent.includes('GST Number:')) {
        // Insert after Business Name and Contact
        newContent = newContent.replace(
          /(Contact: .*)/,
          `$1\nGST Number: GST not applicable – annual turnover below ₹20 lakh threshold`
        );
        updated = true;
      }
      
      // 10. Add Privacy Policy effective date
      if (page.slug === 'privacy' && !newContent.includes('Last Updated:')) {
        newContent = newContent.replace(
          /(Business Name: .*)/,
          `$1\n**Effective Date:** January 1, 2026\n**Last Updated:** ${new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`
        );
        updated = true;
      }

      if (updated) {
        await adminClient.from('legal_pages').update({ content: newContent }).eq('id', page.id);
        console.log(`Updated legal_pages: ${page.slug}`);
      }
    }
  }
}

fixLegalPages();
