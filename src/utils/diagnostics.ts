// Utilitário para diagnóstico de configuração
export const runDiagnostics = () => {
  console.log('=== DIAGNÓSTICO DO SISTEMA ===');
  
  // Verificar variáveis de ambiente
  const envVars = {
    VITE_SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL,
    VITE_SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY,
    MODE: import.meta.env.MODE,
    PROD: import.meta.env.PROD,
    DEV: import.meta.env.DEV,
    BASE_URL: import.meta.env.BASE_URL,
  };
  
  console.log('Variáveis de ambiente:');
  Object.entries(envVars).forEach(([key, value]) => {
    if (key.includes('KEY') || key.includes('SECRET')) {
      console.log(`${key}: ${value ? '***DEFINIDA***' : 'NÃO DEFINIDA'}`);
    } else {
      console.log(`${key}: ${value || 'NÃO DEFINIDA'}`);
    }
  });
  
  // Verificar se estamos em produção
  console.log('\nAmbiente:');
  console.log(`Modo: ${import.meta.env.MODE}`);
  console.log(`Produção: ${import.meta.env.PROD}`);
  console.log(`Desenvolvimento: ${import.meta.env.DEV}`);
  
  // Verificar todas as variáveis disponíveis
  console.log('\nTodas as variáveis disponíveis:');
  console.log(Object.keys(import.meta.env));
  
  // Verificar se o Supabase pode ser inicializado
  try {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
    
    if (supabaseUrl && supabaseKey) {
      console.log('\n✅ Variáveis do Supabase encontradas');
      console.log(`URL: ${supabaseUrl.substring(0, 30)}...`);
      console.log(`Key: ${supabaseKey.substring(0, 20)}...`);
    } else {
      console.log('\n❌ Variáveis do Supabase NÃO encontradas');
      console.log(`URL: ${supabaseUrl || 'UNDEFINED'}`);
      console.log(`Key: ${supabaseKey || 'UNDEFINED'}`);
    }
  } catch (error) {
    console.error('\n❌ Erro ao verificar Supabase:', error);
  }
  
  // Verificar se estamos no Netlify
  const isNetlify = typeof window !== 'undefined' && 
                   (window.location.hostname.includes('netlify.app') || 
                    window.location.hostname.includes('.bolt.host'));
  
  console.log(`\nNetlify: ${isNetlify ? 'SIM' : 'NÃO'}`);
  console.log(`Hostname: ${typeof window !== 'undefined' ? window.location.hostname : 'N/A'}`);
  
  console.log('=== FIM DO DIAGNÓSTICO ===');
  
  return {
    hasSupabaseUrl: !!import.meta.env.VITE_SUPABASE_URL,
    hasSupabaseKey: !!import.meta.env.VITE_SUPABASE_ANON_KEY,
    mode: import.meta.env.MODE,
    isProduction: import.meta.env.PROD,
    isNetlify,
    allEnvKeys: Object.keys(import.meta.env)
  };
};

// Executar diagnóstico automaticamente em desenvolvimento
if (import.meta.env.DEV) {
  runDiagnostics();
}