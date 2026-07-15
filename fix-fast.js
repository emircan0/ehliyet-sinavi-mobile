const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL,
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY
);

async function run() {
  console.log('Fetching questions...');
  const { data: qs, error: qErr } = await supabase.from('questions').select('id, content, exam_question');
  if (qErr) { console.error(qErr); return; }
  
  console.log('Fetching exam_questions...');
  const { data: eqs, error: eqErr } = await supabase.from('exam_questions').select('question_id');
  if (eqErr) { console.error(eqErr); return; }
  
  const eqSet = new Set(eqs.map(e => e.question_id));
  
  const toUpdateTrue = [];
  const toUpdateFalse = [];
  for (const q of qs) {
    const shouldBeInExam = eqSet.has(q.id);
    if (q.exam_question !== shouldBeInExam) {
      if (shouldBeInExam) toUpdateTrue.push(q.id);
      else toUpdateFalse.push(q.id);
    }
  }

  console.log(`Need to set true: ${toUpdateTrue.length}, false: ${toUpdateFalse.length}`);

  if (toUpdateTrue.length > 0) {
    const { error } = await supabase.from('questions').update({ exam_question: true }).in('id', toUpdateTrue);
    if (error) console.error('Error updating true:', error);
  }
  if (toUpdateFalse.length > 0) {
    const { error } = await supabase.from('questions').update({ exam_question: false }).in('id', toUpdateFalse);
    if (error) console.error('Error updating false:', error);
  }
  
  console.log('Identifying duplicates among NON-exam questions...');
  const contentMap = new Map();
  const duplicateIds = [];
  for (const q of qs) {
    if (eqSet.has(q.id)) {
      contentMap.set(q.content.trim().toLowerCase(), q.id);
      continue;
    }
    const c = q.content.trim().toLowerCase();
    if (contentMap.has(c)) {
      duplicateIds.push(q.id);
    } else {
      contentMap.set(c, q.id);
    }
  }
  
  console.log(`Duplicates to delete (non-exam only): ${duplicateIds.length}`);
  if (duplicateIds.length > 0) {
    const { error } = await supabase.from('questions').delete().in('id', duplicateIds);
    if (error) console.error('Delete error:', error);
    else console.log('Successfully deleted duplicates.');
  }
}
run();
