const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('https://frrerflkeorjlkknvexe.supabase.co', 'sb_publishable_4xvjCxmKca-vZ293K33jsQ_hsDcrkiL');
async function run() {
  const { data: exams, error } = await supabase.from('exams').select('*');
  for (const exam of exams) {
    const { count } = await supabase.from('exam_questions').select('*', { count: 'exact', head: true }).eq('exam_id', exam.id);
    console.log(`Exam: ${exam.title}, Questions: ${count}`);
  }
}
run();
