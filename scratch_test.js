const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = 'https://frrerflkeorjlkknvexe.supabase.co';
const supabaseAnonKey = 'sb_publishable_4xvjCxmKca-vZ293K33jsQ_hsDcrkiL';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function test() {
  console.log("Signing up...");
  const { data, error: signUpError } = await supabase.auth.signUp({
    email: 'test_user_' + Date.now() + '@example.com',
    password: 'password123'
  });
  
  if (signUpError) {
    console.log("SignUp Error:", signUpError);
    return;
  }
  
  const userId = data.user.id;
  console.log("User ID:", userId);
  
  console.log("Testing upsert...");
  const { error: upsertError } = await supabase
    .from('user_answers')
    .upsert([{ 
      user_id: userId, 
      question_id: '00000000-0000-0000-0000-000000000000', // Might fail FK constraint, but let's see
      selected_option: 0, 
      is_correct: true, 
      solved_at: new Date().toISOString() 
    }], { onConflict: 'user_id,question_id' });
  console.log("Upsert Error:", upsertError);

  console.log("Testing insert to exam_results...");
  const { error: insertError } = await supabase
    .from('exam_results')
    .insert([{
      user_id: userId,
      category: 'quick',
      score: 100,
      correct_count: 1,
      wrong_count: 0,
      empty_count: 0,
      total_questions: 1,
      duration_seconds: 10,
      started_at: new Date().toISOString(),
      completed_at: new Date().toISOString(),
      quiz_type: 'quick',
      session_id: 'test_session_id'
    }]);
  console.log("Insert Error:", insertError);
}
test();
