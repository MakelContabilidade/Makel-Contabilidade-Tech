const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env' });
if (!process.env.VITE_SUPABASE_URL && require('fs').existsSync('.env.local')) {
    require('dotenv').config({ path: '.env.local' });
}

// ATENÇÃO: Para rodar este script e furar o bloqueio de RLS e Confirmação de E-mail,
// é necessário usar a SUPABASE_SERVICE_ROLE_KEY encontrada nas configurações do seu projeto Supabase (Project Settings > API).
const supabaseUrl = 'https://nkvwyumzxobvxashtooo.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'sb_publishable_1B_0eojVv-yIUFTqMoPswg_2z0dglXi'; // Just an attempt if they don't have service role key but wait... this script NEEDS service role key.

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function createMaster() {
  const email = 'kleber.adm@makelcontabilidade.com';
  const password = 'Kleber@05';
  const name = 'Kleber Felipe';

  console.log(`Tentando criar/autenticar usuário MASTER: ${email}`);

  if (supabaseServiceKey === 'COLOQUE_SUA_SERVICE_ROLE_KEY_AQUI' || !supabaseServiceKey) {
     console.error('\n=======================================');
     console.error('ERRO: Você precisa definir a variável SUPABASE_SERVICE_ROLE_KEY.');
     console.error('1. Vá em "Project Settings" > "API" no seu painel do Supabase.');
     console.error('2. Copie a chave "service_role" (secret).');
     console.error('3. Defina no seu arquivo .env ou execute o script passando a variável:');
     console.error('   SUPABASE_SERVICE_ROLE_KEY="sua_chave" node create-master.cjs');
     console.error('=======================================\n');
     return;
  }

  const { data: authData, error: signUpError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      name,
      company_name: 'Makel Contabilidade'
    }
  });

  let userId = authData?.user?.id;

  if (signUpError) {
    if (signUpError.message.includes('already registered') || signUpError.message.includes('already exists')) {
        console.log('Usuário já existe no Auth. Buscando ID do usuário para atualizar a senha...');
        
        const { data: usersData, error: usersError } = await supabase.auth.admin.listUsers();
        if (usersError) {
            console.error('Erro ao listar usuários:', usersError.message);
            return;
        }
        
        const existingUser = usersData.users.find(u => u.email === email);
        if (existingUser) {
           userId = existingUser.id;
           console.log(`Usuário encontrado. Atualizando senha para: "${password}"...`);
           const { error: updateAuthError } = await supabase.auth.admin.updateUserById(userId, {
              password: password
           });
           if (updateAuthError) {
              console.error('Erro ao atualizar senha no Supabase Auth:', updateAuthError.message);
              return;
           }
           console.log('Senha atualizada com sucesso no Supabase Auth!');
        } else {
           console.error('Usuário não encontrado na listagem.');
           return;
        }
    } else {
        console.error('Erro ao criar usuário:', signUpError.message);
        return;
    }
  }

  console.log(`Usuário garantido no Auth. ID: ${userId}`);

  console.log('Criando/Atualizando perfil para MASTER na tabela profiles...');
  const { data: updateData, error: updateError } = await supabase
    .from('profiles')
    .upsert({ 
        id: userId,
        email: email,
        name: name,
        company_name: 'Makel Contabilidade',
        role: 'MASTER',
        status: 'active',
        must_change_password: true,
        updated_at: new Date().toISOString()
    }, { onConflict: 'id' })
    .select();

  if (updateError) {
      console.error('\nErro ao atualizar perfil para MASTER:', updateError.message);
      if (updateError.message.includes('schema cache') || updateError.code === 'PGRST205') {
          console.log('\n=======================================');
          console.log('FALHA DE ESQUEMA (TABELAS AUSENTES)');
          console.log('As tabelas do banco de dados (como "profiles") ainda não foram criadas no seu projeto.');
          console.log('Para corrigir:');
          console.log('1. Abra o painel do Supabase, vá em "SQL Editor".');
          console.log('2. Copie e cole todo o conteúdo do arquivo "supabase-schema.sql" que está na pasta raiz do projeto.');
          console.log('3. Clique em "Run" para criar as tabelas.');
          console.log('4. Rode este script novamente.');
          console.log('=======================================\n');
      }
  } else {
      console.log('\nSucesso! O perfil MASTER foi ativado.', updateData);
      console.log(`\nVocê já pode fazer login no sistema com as credenciais:`);
      console.log(`E-mail: ${email}`);
      console.log(`Senha:  ${password}`);
  }
}

createMaster();
