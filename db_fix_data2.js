import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const adminClient = createClient(supabaseUrl, serviceRoleKey);

async function fixData2() {
  console.log('Fixing data part 2...');

  // 1. services: ReadinEnergies -> Energy Reading
  const { data: services } = await adminClient.from('services').select('*');
  if (services) {
    for (const svc of services) {
      if (svc.description && svc.description.includes('ReadinEnergies')) {
        await adminClient.from('services').update({ description: svc.description.replace(/ReadinEnergies/gi, 'Energy Reading') }).eq('id', svc.id);
        console.log(`Updated services: ${svc.slug}`);
      }
    }
  }

  // 2. pages: About Harshada Harshada -> About Harshada
  const { data: pages } = await adminClient.from('pages').select('*');
  if (pages) {
    for (const page of pages) {
      if (page.title && page.title.includes('About Harshada Harshada')) {
        await adminClient.from('pages').update({ title: page.title.replace(/About Harshada Harshada/gi, 'About Harshada') }).eq('id', page.id);
        console.log(`Updated pages title: ${page.slug}`);
      }
      if (page.content && page.content.includes('About Harshada Harshada')) {
        await adminClient.from('pages').update({ content: page.content.replace(/About Harshada Harshada/gi, 'About Harshada') }).eq('id', page.id);
        console.log(`Updated pages content: ${page.slug}`);
      }
    }
  }

  // 3. page_blocks: About Harshada Harshada
  const { data: pageBlocks } = await adminClient.from('page_blocks').select('*');
  if (pageBlocks) {
    for (const block of pageBlocks) {
      let updated = false;
      let newContent = { ...block.content };

      if (newContent.title && typeof newContent.title === 'string' && newContent.title.includes('About Harshada Harshada')) {
         newContent.title = newContent.title.replace(/About Harshada Harshada/gi, 'About Harshada');
         updated = true;
      }
      
      // Let's also check if HighlyAligned is in 'title' or 'description'
      if (newContent.title && typeof newContent.title === 'string' && newContent.title.includes('HighlyAligned')) {
         newContent.title = newContent.title.replace(/HighlyAligned/gi, 'Selfaligned');
         updated = true;
      }
      if (newContent.description && typeof newContent.description === 'string' && newContent.description.includes('HighlyAligned')) {
         newContent.description = newContent.description.replace(/HighlyAligned/gi, 'Selfaligned');
         updated = true;
      }

      if (updated) {
        await adminClient.from('page_blocks').update({ content: newContent }).eq('id', block.id);
        console.log(`Updated page_blocks again: ${block.block_key}`);
      }
    }
  }

  console.log('Done fixing part 2.');
}

fixData2();
