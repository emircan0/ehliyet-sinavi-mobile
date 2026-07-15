const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: __dirname + '/.env' });

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://frrerflkeorjlkknvexe.supabase.co';
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_4xvjCxmKca-vZ293K33jsQ_hsDcrkiL';
const supabase = createClient(supabaseUrl, supabaseKey);

function normalizeText(text) {
  if (!text) return '';
  return text.trim().toLowerCase().replace(/\s+/g, ' ');
}

async function run() {
  console.log('Fetching all questions...');
  const { data: allQuestions, error: qErr } = await supabase
    .from('questions')
    .select('id, content, options, exam_question');

  if (qErr) {
    console.error('Error fetching questions:', qErr);
    return;
  }
  
  console.log(`Total questions fetched: ${allQuestions.length}`);

  const contentSet = new Set();
  const optionsSet = new Set();
  const duplicateIdsToDelete = [];
  const validQuestionsToUpdate = [];

  for (const q of allQuestions) {
    const normContent = normalizeText(q.content);
    
    // Normalize options
    let normOptionsStr = '';
    if (Array.isArray(q.options)) {
      // Sort options so that order doesn't matter, though normally order matters.
      // We stringify the set of options to detect exactly duplicate option lists.
      const sortedOptions = [...q.options].map(normalizeText).sort();
      // Only consider it a duplicate by options if the options list is somewhat substantial
      // E.g. avoid false positives on ["doğru", "yanlış"] if there were such questions
      if (sortedOptions.length > 2) {
        normOptionsStr = JSON.stringify(sortedOptions);
      }
    }

    const isContentDuplicate = normContent && contentSet.has(normContent);
    const isOptionsDuplicate = normOptionsStr && optionsSet.has(normOptionsStr);

    if (isContentDuplicate || isOptionsDuplicate) {
      duplicateIdsToDelete.push(q.id);
    } else {
      // First time seeing this question
      if (normContent) contentSet.add(normContent);
      if (normOptionsStr) optionsSet.add(normOptionsStr);
      
      validQuestionsToUpdate.push(q.id);
    }
  }

  console.log(`Found ${duplicateIdsToDelete.length} duplicates to delete.`);
  console.log(`Found ${validQuestionsToUpdate.length} unique questions to keep and update.`);

  // 1. Delete duplicates
  if (duplicateIdsToDelete.length > 0) {
    console.log('Deleting duplicates in batches...');
    const batchSize = 100;
    for (let i = 0; i < duplicateIdsToDelete.length; i += batchSize) {
      const batch = duplicateIdsToDelete.slice(i, i + batchSize);
      const { error: delErr } = await supabase.from('questions').delete().in('id', batch);
      if (delErr) {
        console.error('Error deleting batch:', delErr);
      } else {
        console.log(`Deleted batch of ${batch.length} duplicates.`);
      }
    }
  }

  // 2. Set exam_question to false for remaining questions
  if (validQuestionsToUpdate.length > 0) {
    console.log('Setting exam_question = false for all unique questions in batches...');
    const batchSize = 100;
    for (let i = 0; i < validQuestionsToUpdate.length; i += batchSize) {
      const batch = validQuestionsToUpdate.slice(i, i + batchSize);
      const { error: updateErr } = await supabase
        .from('questions')
        .update({ exam_question: false })
        .in('id', batch);
        
      if (updateErr) {
        console.error('Error updating batch:', updateErr);
      } else {
        console.log(`Updated batch of ${batch.length} questions to exam_question = false.`);
      }
    }
  }

  console.log('Cleanup completely finished.');
}

run();
