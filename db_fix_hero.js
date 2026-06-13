import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const adminClient = createClient(supabaseUrl, serviceRoleKey);

async function updateHeroBlocks() {
  const blocksToUpdate = {
    'hero_tagline': "Welcome to Your Soul's Journey",
    'hero_title': 'Find Clarity. Embrace Stillness.\nTransform Within.',
    'hero_description': 'Step into a space of mindful self-discovery and inner growth. Explore our curated collection of sacred tools, personalized Vedic astrology guidance, and one-on-one wellness consultations designed to support your journey toward balance and purpose.'
  };

  const { data: pageBlocks } = await adminClient.from('page_blocks').select('*').in('block_key', Object.keys(blocksToUpdate));
  
  if (pageBlocks) {
    for (const block of pageBlocks) {
      const newText = blocksToUpdate[block.block_key];
      if (newText) {
        let newContent = { ...block.content, text: newText };
        await adminClient.from('page_blocks').update({ content: newContent }).eq('id', block.id);
        console.log(`Updated page_blocks: ${block.block_key}`);
      }
    }
  }
}

updateHeroBlocks();
