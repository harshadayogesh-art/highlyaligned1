import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const adminClient = createClient(supabaseUrl, serviceRoleKey);

async function fixData3() {
  console.log('Fixing data part 3...');

  const { data: pageBlocks } = await adminClient.from('page_blocks').select('*').eq('block_key', 'hero_title');
  if (pageBlocks) {
    for (const block of pageBlocks) {
      if (block.content.text === 'About Harshada') {
        let newContent = { ...block.content, text: 'About' };
        await adminClient.from('page_blocks').update({ content: newContent }).eq('id', block.id);
        console.log(`Updated page_blocks: ${block.block_key}`);
      }
    }
  }
}

fixData3();
