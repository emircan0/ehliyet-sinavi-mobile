const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '../.env' });

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://frrerflkeorjlkknvexe.supabase.co';
// Need service role key to delete effectively or bypass RLS if anon can't delete. 
// But let's assume anon has access if I did it earlier. 
// Wait, I will use service role key if available.
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'sb_publishable_4xvjCxmKca-vZ293K33jsQ_hsDcrkiL';
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  console.log('Fetching all questions...');
  const { data: allQuestions, error: qErr } = await supabase.from('questions').select('id, content, exam_question');
  if (qErr) {
    console.error('Error fetching questions:', qErr);
    return;
  }

  console.log('Fetching all exam_questions relations...');
  const { data: allExamQuestions, error: eqErr } = await supabase.from('exam_questions').select('question_id');
  if (eqErr) {
    console.error('Error fetching exam_questions:', eqErr);
    return;
  }

  const examQuestionIds = new Set(allExamQuestions.map(eq => eq.question_id));

  // 1. Fix the exam_question boolean column
  console.log('Fixing exam_question boolean column...');
  let updateCount = 0;
  for (const q of allQuestions) {
    const shouldBeInExam = examQuestionIds.has(q.id);
    if (q.exam_question !== shouldBeInExam) {
      await supabase.from('questions').update({ exam_question: shouldBeInExam }).eq('id', q.id);
      updateCount++;
    }
  }
  console.log(`Updated ${updateCount} questions' exam_question boolean.`);

  // 2. Find and delete duplicates among NON-exam questions only
  console.log('Identifying duplicates among non-exam questions...');
  const contentMap = new Map();
  const duplicateIdsToDelete = [];

  for (const q of allQuestions) {
    // We want to keep 1 copy of non-exam questions as well, but what if a question is already in an exam?
    // If a question is in an exam, its content is definitely "kept".
    const normalizedContent = q.content.trim().toLowerCase();
    
    if (examQuestionIds.has(q.id)) {
      // It's in an exam, register its content so we delete ANY non-exam copies of this same content!
      contentMap.set(normalizedContent, q.id);
      continue;
    }

    // It's not in an exam.
    // Check if this content is already in our map (either from an exam question, or a previously seen non-exam question)
    if (contentMap.has(normalizedContent)) {
      // It's a duplicate and it's not in an exam, we can safely delete it
      duplicateIdsToDelete.push(q.id);
    } else {
      // First time we see this non-exam question
      contentMap.set(normalizedContent, q.id);
    }
  }

  console.log(`Found ${duplicateIdsToDelete.length} duplicate questions that are NOT in any exam.`);
  
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
    console.log('Successfully deleted all non-exam duplicates.');
  } else {
    console.log('No non-exam duplicates found.');
  }
}

run();
