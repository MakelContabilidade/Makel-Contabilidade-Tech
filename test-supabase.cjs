const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = 'https://nkvwyumzxobvxashtooo.supabase.co';
const supabaseKey = 'sb_publishable_1B_0eojVv-yIUFTqMoPswg_2z0dglXi';
const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
    const { data: user, error: loginE } = await supabase.auth.signInWithPassword({
        email: 'kleber.adm@makelcontabilidade.com',
        password: 'MasterPassword123!'
    });
    if (loginE) console.error(loginE);
    const { data, error } = await supabase.from('profiles').select('*').limit(1);
    console.log(data, error);
}
check();
