const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('https://nkvwyumzxobvxashtooo.supabase.com', 'sb_publishable_1B_0eojVv-yIUFTqMoPswg_2z0dglXi');
supabase.auth.signUp({ email: 'test@example.com', password: 'password123' })
  .then(res => console.log('Response:', JSON.stringify(res, null, 2)))
  .catch(err => console.error('Error:', err));
