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
  console.log('Fixing data in Supabase...');

  // 1. legal_pages: Fix HighlyAligned -> Selfaligned
  const { data: legalPages } = await adminClient.from('legal_pages').select('*');
  if (legalPages) {
    for (const page of legalPages) {
      let updated = false;
      let newTitle = page.title;
      let newDesc = page.meta_description;
      let newContent = page.content;

      if (newTitle && newTitle.includes('HighlyAligned')) { newTitle = newTitle.replace(/HighlyAligned/gi, 'Selfaligned'); updated = true; }
      if (newDesc && newDesc.includes('HighlyAligned')) { newDesc = newDesc.replace(/HighlyAligned/gi, 'Selfaligned'); updated = true; }
      if (newContent && newContent.includes('HighlyAligned')) { newContent = newContent.replace(/HighlyAligned/gi, 'Selfaligned'); updated = true; }

      if (updated) {
        await adminClient.from('legal_pages').update({ title: newTitle, meta_description: newDesc, content: newContent }).eq('id', page.id);
        console.log(`Updated legal_pages: ${page.slug}`);
      }
    }
  }

  // 2. page_blocks: Fix HighlyAligned, ReadinEnergies, and About Harshada Harshada
  const { data: pageBlocks } = await adminClient.from('page_blocks').select('*');
  if (pageBlocks) {
    for (const block of pageBlocks) {
      let updated = false;
      let newContent = { ...block.content };

      if (newContent.text) {
        if (typeof newContent.text === 'string' && newContent.text.includes('HighlyAligned')) {
          newContent.text = newContent.text.replace(/HighlyAligned/gi, 'Selfaligned');
          updated = true;
        }
        if (typeof newContent.text === 'string' && newContent.text.includes('ReadinEnergies')) {
          newContent.text = newContent.text.replace(/ReadinEnergies/gi, 'Energy Reading');
          updated = true;
        }
        if (typeof newContent.text === 'string' && newContent.text.includes('About Harshada Harshada')) {
          newContent.text = newContent.text.replace(/About Harshada Harshada/gi, 'About Harshada');
          updated = true;
        }
      }

      if (updated) {
        await adminClient.from('page_blocks').update({ content: newContent }).eq('id', block.id);
        console.log(`Updated page_blocks: ${block.block_key}`);
      }
    }
  }

  // 3. pages: Fix HighlyAligned
  const { data: pages } = await adminClient.from('pages').select('*');
  if (pages) {
    for (const page of pages) {
      let updated = false;
      let newTitle = page.title;
      let newContent = page.content;

      if (newTitle && newTitle.includes('HighlyAligned')) { newTitle = newTitle.replace(/HighlyAligned/gi, 'Selfaligned'); updated = true; }
      if (newContent && newContent.includes('HighlyAligned')) { newContent = newContent.replace(/HighlyAligned/gi, 'Selfaligned'); updated = true; }

      if (updated) {
        await adminClient.from('pages').update({ title: newTitle, content: newContent }).eq('id', page.id);
        console.log(`Updated pages: ${page.slug}`);
      }
    }
  }

  console.log('Done fixing DB data.');
}

fixData();
