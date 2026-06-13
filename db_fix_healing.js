import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY env vars');
  process.exit(1);
}

const adminClient = createClient(supabaseUrl, serviceRoleKey);

async function fixData() {
  console.log('Fixing healing data in Supabase...');

  // 1. services: delete Chakra Healing, Energy Healing
  await adminClient.from('services').delete().ilike('name', '%chakra healing%');
  await adminClient.from('services').delete().ilike('name', '%energy healing%');
  console.log('Deleted related services');

  // 2. products: delete Chakra Tools
  await adminClient.from('products').delete().ilike('name', '%chakra tools%');
  console.log('Deleted related products');

  // 3. page_blocks
  const { data: pageBlocks } = await adminClient.from('page_blocks').select('*');
  if (pageBlocks) {
    for (const block of pageBlocks) {
      let updated = false;
      let newContent = { ...block.content };

      if (block.block_key === 'testimonial_1' && newContent.text && newContent.text.includes('chakra healing')) {
          // just delete this testimonial
          await adminClient.from('page_blocks').delete().eq('id', block.id);
          console.log(`Deleted testimonial_1`);
          continue;
      }

      if (newContent.text) {
        if (typeof newContent.text === 'string' && newContent.text.includes('energy healing')) {
          newContent.text = newContent.text.replace(/, energy healing/gi, '');
          newContent.text = newContent.text.replace(/ and energy healing/gi, '');
          newContent.text = newContent.text.replace(/ energy healing/gi, '');
          updated = true;
        }
        if (typeof newContent.text === 'string' && newContent.text.includes('Chakra Healer')) {
          newContent.text = newContent.text.replace(/ \| Chakra Healer/gi, '');
          newContent.text = newContent.text.replace(/, and Chakra Healer/gi, '');
          updated = true;
        }
        if (typeof newContent.text === 'string' && newContent.text.includes('Energy Healing Expert')) {
           // We might just delete the cert block if it is cert_4
        }
      }
      
      if (newContent.description) {
         if (typeof newContent.description === 'string' && newContent.description.includes('energy healing')) {
            newContent.description = newContent.description.replace(/ and energy healing/gi, '');
            updated = true;
         }
      }

      if (updated) {
        await adminClient.from('page_blocks').update({ content: newContent }).eq('id', block.id);
        console.log(`Updated page_blocks: ${block.block_key}`);
      }
      
      if (block.block_key === 'cert_4' && newContent.text && newContent.text.includes('Energy Healing Expert')) {
         await adminClient.from('page_blocks').delete().eq('id', block.id);
         console.log(`Deleted cert_4`);
      }
    }
  }

  // 4. legal_pages
  const { data: legalPages } = await adminClient.from('legal_pages').select('*');
  if (legalPages) {
    for (const page of legalPages) {
      let updated = false;
      let newContent = page.content;

      if (newContent && newContent.includes('energy healing')) {
        newContent = newContent.replace(/, energy healing sessions,/gi, '');
        updated = true;
      }

      if (updated) {
        await adminClient.from('legal_pages').update({ content: newContent }).eq('id', page.id);
        console.log(`Updated legal_pages: ${page.slug}`);
      }
    }
  }

  console.log('Done fixing healing data.');
}

fixData();
