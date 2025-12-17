import { execSync } from 'node:child_process';

const envVars = [
  // ⚠️ Não commite segredos aqui. Preencha via variáveis de ambiente do seu SO
  // Exemplo (PowerShell):
  //   $env:SUPABASE_URL="https://SEU_PROJETO.supabase.co"
  //   $env:SUPABASE_ANON_KEY="sb_publishable_..."
  { name: 'JWT_SECRET', value: process.env.JWT_SECRET || '', sensitive: true },
  { name: 'DISCORD_CLIENT_ID', value: process.env.DISCORD_CLIENT_ID || '', sensitive: false },
  { name: 'DISCORD_CLIENT_SECRET', value: process.env.DISCORD_CLIENT_SECRET || '', sensitive: true },
  { name: 'DISCORD_REDIRECT_URI', value: process.env.DISCORD_REDIRECT_URI || 'https://vye-v1.vercel.app/api/auth/discord/callback', sensitive: false },
  { name: 'SUPABASE_URL', value: process.env.SUPABASE_URL || '', sensitive: false },
];

const environments = ['production', 'preview', 'development'];

console.log('Configurando variáveis de ambiente no Vercel...\n');

function addEnvVar({ name, value, env, sensitive }) {
  if (!value) {
    console.log(`  ⚠️  Pulando ${name} (${env}): valor vazio`);
    return;
  }

  // Passa as respostas via stdin:
  // 1) valor
  // 2) "y/n" para marcar como secret no Vercel (depende da versão do CLI)
  const input = `${value}\n${sensitive ? 'y' : 'n'}\n`;

  execSync(`vercel env add ${name} ${env} --force`, {
    stdio: ['pipe', 'pipe', 'pipe'],
    input,
    encoding: 'utf8',
  });
}

envVars.forEach(({ name, value, sensitive }) => {
  console.log(`\n📝 Configurando ${name}...`);
  
  environments.forEach(env => {
    try {
      addEnvVar({ name, value, env, sensitive });
      console.log(`  ✅ ${env} configurado`);
    } catch (error) {
      // Se já existe, tenta atualizar
      try {
        execSync(`vercel env rm ${name} ${env} --yes`, { stdio: 'pipe', encoding: 'utf8' });
        addEnvVar({ name, value, env, sensitive });
        console.log(`  ✅ ${env} atualizado`);
      } catch (updateError) {
        console.log(`  ⚠️  ${env}: ${updateError.message.split('\n')[0]}`);
      }
    }
  });
});

console.log('\n✅ Configuração concluída!');
console.log('\n⚠️  IMPORTANTE: Configure também SUPABASE_ANON_KEY (e confira SUPABASE_URL) no painel do Vercel.');

