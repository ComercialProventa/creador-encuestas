const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function check() {
  const { data, error } = await supabase.rpc('query', { sql_query: "SELECT pg_get_constraintdef(oid) FROM pg_constraint WHERE conname = 'questions_type_check';" });
  if (error) {
    console.error('RPC failed, trying raw postgrest:', error.message);
    // Let's just try to insert a question with a bad type and catch the error hint
    const { error: insertErr } = await supabase.from('questions').insert({
      survey_id: '00000000-0000-0000-0000-000000000000',
      title: 'test',
      type: 'INVALID_TYPE',
      order_index: 0
    });
    console.log(insertErr);
  } else {
    console.log(data);
  }
}
check();
