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
  console.log(`Current total questions: ${qs.length}`);
  
  const groups = new Map();
  for (const q of qs) {
    const norm = aggressiveNormalize(q.content);
    if (!groups.has(norm)) groups.set(norm, []);
    groups.get(norm).push(q);
  }
  
  let duplicateCount = 0;
  for (const [norm, group] of groups.entries()) {
    if (group.length > 1) {
      console.log(`\nFound group of ${group.length} duplicates by aggressive content normalization:`);
      group.forEach(q => console.log(` - ID: ${q.id} | Content: ${q.content.substring(0, 50)}...`));
      duplicateCount += group.length - 1;
    }
  }
  
  console.log(`\nTotal potential duplicates found by content: ${duplicateCount}`);
  
  // Also check options
  const optGroups = new Map();
  for (const q of qs) {
    if (Array.isArray(q.options) && q.options.length > 2) {
      const sorted = [...q.options].map(aggressiveNormalize).sort();
      const str = JSON.stringify(sorted);
      if (!optGroups.has(str)) optGroups.set(str, []);
      optGroups.get(str).push(q);
    }
  }
  
  let optDupCount = 0;
  for (const [str, group] of optGroups.entries()) {
    if (group.length > 1) {
      console.log(`\nFound group of ${group.length} duplicates by aggressive options normalization:`);
      group.forEach(q => console.log(` - ID: ${q.id} | Opts: ${JSON.stringify(q.options)} | Content: ${q.content.substring(0, 30)}...`));
      optDupCount += group.length - 1;
    }
  }
  console.log(`\nTotal potential duplicates found by options: ${optDupCount}`);
}
run();
