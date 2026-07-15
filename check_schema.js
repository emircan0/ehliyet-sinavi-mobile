const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = 'https://frrerflkeorjlkknvexe.supabase.co';
const supabaseKey = 'sb_publishable_4xvjCxmKca-vZ293K33jsQ_hsDcrkiL';
const supabase = createClient(supabaseUrl, supabaseKey);
async function run() {
  const { data, error } = await supabase.from('questions').select('*').limit(1);
  if (error) console.error(error);
  else console.log(Object.keys(data[0]));
}
run();
