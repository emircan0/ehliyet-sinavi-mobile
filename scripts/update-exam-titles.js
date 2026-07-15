const path = require('path');
const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

const PROJECT_ROOT = path.resolve(__dirname, '..');

// Load environment variables from .env
function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return;

  const lines = fs.readFileSync(filePath, 'utf8').split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#') || !trimmed.includes('=')) continue;

    const index = trimmed.indexOf('=');
    const key = trimmed.slice(0, index).trim();
    const value = trimmed.slice(index + 1).trim().replace(/^['"]|['"]$/g, '');
    if (key && process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}

loadEnvFile(path.join(PROJECT_ROOT, '.env'));

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error("Missing Supabase credentials in .env file.");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function updateTitles() {
  console.log("Fetching exams...");
  const { data: exams, error: fetchError } = await supabase
    .from('exams')
    .select('id, title, created_at')
    .order('created_at', { ascending: true }); // Oldest first

  if (fetchError) {
    console.error("Error fetching exams:", fetchError);
    return;
  }

  console.log(`Found ${exams.length} exams. Updating titles...`);

  let updatedCount = 0;
  for (let i = 0; i < exams.length; i++) {
    const exam = exams[i];
    const newTitle = `Genel Deneme ${i + 1}`;
    
    if (exam.title === newTitle) {
      console.log(`Exam ${exam.id} already has title '${newTitle}', skipping...`);
      continue;
    }

    const { error: updateError } = await supabase
      .from('exams')
      .update({ title: newTitle })
      .eq('id', exam.id);

    if (updateError) {
      console.error(`Error updating exam ${exam.id}:`, updateError);
    } else {
      console.log(`Updated exam ${exam.id} to '${newTitle}'`);
      updatedCount++;
    }
  }

  console.log(`Finished updating. Successfully updated ${updatedCount} exams.`);
}

updateTitles().catch(console.error);
