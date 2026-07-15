const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: __dirname + '/.env' });
const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://frrerflkeorjlkknvexe.supabase.co',
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_4xvjCxmKca-vZ293K33jsQ_hsDcrkiL'
);

function aggressiveNormalize(text) {
  if (!text) return '';
  return text.toLowerCase().replace(/[^a-z0-9çğıöşü]/g, '');
}

async function run() {
  const { data: qs } = await supabase.from('questions').select('id, content, options');
  
  const contentGroups = new Map();
  const optionGroups = new Map();
  
  const toDelete = new Set();
  
  for (const q of qs) {
    const normContent = aggressiveNormalize(q.content);
    
    let normOptionsStr = '';
    if (Array.isArray(q.options) && q.options.length > 2) {
      const sorted = [...q.options].map(aggressiveNormalize).sort();
      normOptionsStr = JSON.stringify(sorted);
    }
    
    const isContentDup = normContent && contentGroups.has(normContent);
    const isOptDup = normOptionsStr && optionGroups.has(normOptionsStr);
    
    if (isContentDup || isOptDup) {
      toDelete.add(q.id);
    } else {
      if (normContent) contentGroups.set(normContent, true);
      if (normOptionsStr) optionGroups.set(normOptionsStr, true);
    }
  }
  
  const toDeleteArray = Array.from(toDelete);
  console.log(`Found ${toDeleteArray.length} more duplicates to delete using aggressive matching.`);
  
  if (toDeleteArray.length > 0) {
    const batchSize = 100;
    for (let i = 0; i < toDeleteArray.length; i += batchSize) {
      const batch = toDeleteArray.slice(i, i + batchSize);
      const { error } = await supabase.from('questions').delete().in('id', batch);
      if (error) console.error(error);
      else console.log(`Deleted batch of ${batch.length}`);
    }
    console.log('Finished deleting.');
  }
}
run();
