import React, { useState, useEffect } from 'react';
import { CreditCard, Key, Settings, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { supabase, StripeConfig } from '../lib/supabase';
import { clearStripeCache } from '../lib/stripe';

const StripeSettings: React.FC = () => {
  const [config, setConfig] = useState<StripeConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<'success' | 'error' | null>(null);
  const [simulatingPayment, setSimulatingPayment] = useState(false);
  const [formData, setFormData] = useState({
    test_publishable_key: '',
    test_secret_key: '',
    test_webhook_secret: '',
    prod_publishable_key: '',
    prod_secret_key: '',
    prod_webhook_secret: '',
    is_test_mode: true,
    pix_enabled: false
  });

  useEffect(() => {
    loadStripeConfig();
  }, []);

  const loadStripeConfig = async () => {
    try {
      // Verificar se as variáveis de ambiente estão configuradas
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      
      if (!supabaseUrl || !supabaseKey) {
        console.error('Variáveis de ambiente do Supabase não configuradas');
        return;
      }

      const { data, error } = await supabase
        .from('stripe_config')
        .select(`
          *,
          test_publishable_key,
          test_secret_key,
          test_webhook_secret,
          prod_publishable_key,
          prod_secret_key,
          prod_webhook_secret
        `)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Erro ao carregar configuração do Stripe:', error);
        return;
      }

      if (data) {
        setConfig(data);
        setFormData({
          test_publishable_key: data.test_publishable_key || '',
          test_secret_key: data.test_secret_key || '',
          test_webhook_secret: data.test_webhook_secret || '',
          prod_publishable_key: data.prod_publishable_key || '',
          prod_secret_key: data.prod_secret_key || '',
          prod_webhook_secret: data.prod_webhook_secret || '',
          is_test_mode: data.is_test_mode,
          pix_enabled: data.pix_enabled
        });
      }
    } catch (error) {
      console.error('Erro ao carregar configuração do Stripe:', error);
      // Em caso de erro de rede, não quebrar a interface
      setConfig(null);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Ensure we have a single configuration record
      let configId = config?.id;
      
      if (!configId) {
        // Create initial config if none exists
        const { data: newConfig, error: createError } = await supabase
          .from('stripe_config')
          .insert([{
            is_test_mode: formData.is_test_mode,
            pix_enabled: formData.pix_enabled
          }])
          .select()
          .single();
          
        if (createError) throw createError;
        configId = newConfig.id;
      }

      const dataToSave = {
        ...formData,
        updated_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('stripe_config')
        .update(dataToSave)
        .eq('id', configId);

      if (error) throw error;

      await loadStripeConfig();
      clearStripeCache(); // Limpar cache do Stripe
      setTestResult(null);
      
      alert('Configurações salvas com sucesso!');
    } catch (error) {
      console.error('Error saving Stripe config:', error);
      alert('Erro ao salvar configurações. Tente novamente.');
    } finally {
      setSaving(false);
    }
  };

  const testStripeConnection = async () => {
    const currentSecretKey = formData.is_test_mode 
      ? formData.test_secret_key 
      : formData.prod_secret_key;
      
    const currentPublishableKey = formData.is_test_mode 
      ? formData.test_publishable_key 
      : formData.prod_publishable_key;

    if (!currentPublishableKey || !currentSecretKey) {
      setTestResult('error');
      alert('Por favor, preencha as chaves do modo selecionado antes de testar.');
      return;
    }

    setTesting(true);
    try {
      // Testar conexão real com Stripe - usar endpoint mais simples
      const response = await fetch('https://api.stripe.com/v1/balance', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${currentSecretKey}`,
        },
      });

      if (response.ok) {
        setTestResult('success');
      } else {
        const errorData = await response.json();
        console.error('Stripe test error:', errorData);
        setTestResult('error');
      }
    } catch (error) {
      console.error('Stripe connection test failed:', error);
      setTestResult('error');
    } finally {
      setTesting(false);
    }
  };

  const simulateTestPayment = async () => {
    if (!config) return;
    
    setSimulatingPayment(true);
    try {
      // Criar uma doação de teste
      const { data: donation, error } = await supabase
        .from('donations')
        .insert([{
          donor_name: 'Teste Simulado',
          donor_email: 'teste@exemplo.com',
          donor_phone: '(11) 99999-9999',
          amount: 50.00,
          currency: 'BRL',
          payment_method: 'card',
          stripe_payment_intent_id: `pi_test_${Date.now()}`,
          status: 'completed',
          message: 'Doação de teste simulada pelo painel administrativo',
        }])
        .select()
        .single();

      if (error) throw error;
      
      alert('Doação de teste criada com sucesso! Status: Concluída');
    } catch (error) {
      console.error('Erro ao simular pagamento:', error);
      alert('Erro ao criar doação de teste');
    } finally {
      setSimulatingPayment(false);
    }
  };

  const updateAllPendingToCompleted = async () => {
    if (!confirm('Deseja marcar todas as doações pendentes como concluídas? Esta ação não pode ser desfeita.')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('donations')
        .update({ 
          status: 'completed',
          updated_at: new Date().toISOString()
        })
        .eq('status', 'pending');

      if (error) throw error;
      
      alert('Todas as doações pendentes foram marcadas como concluídas!');
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
      alert('Erro ao atualizar status das doações');
    }
  };

  const testWebhookConnection = async () => {
    if (!config) return;
    
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const webhookUrl = `${supabaseUrl}/functions/v1/stripe-webhook`;
      
      // Testar se o webhook está acessível
      const response = await fetch(webhookUrl, {
        method: 'OPTIONS',
      });
      
      if (response.ok) {
        alert(`Webhook acessível em: ${webhookUrl}\n\nConfigure este URL no seu Dashboard do Stripe em:\nDevelopers → Webhooks → Add endpoint`);
      } else {
        alert('Webhook não está acessível. Verifique se as Edge Functions estão funcionando.');
      }
    } catch (error) {
      console.error('Erro ao testar webhook:', error);
      alert('Erro ao testar webhook. Verifique a configuração.');
    }
  };

  const getCurrentKeys = () => {
    if (formData.is_test_mode) {
      return {
        publishable_key: formData.test_publishable_key,
        secret_key: formData.test_secret_key,
        webhook_secret: formData.test_webhook_secret
      };
    } else {
      return {
        publishable_key: formData.prod_publishable_key,
        secret_key: formData.prod_secret_key,
        webhook_secret: formData.prod_webhook_secret
      };
    }
  };

  const updateCurrentKeys = (field: string, value: string) => {
    if (formData.is_test_mode) {
      setFormData({
        ...formData,
        [`test_${field}`]: value
      });
    } else {
      setFormData({
        ...formData,
        [`prod_${field}`]: value
      });
    }
  };

  const currentKeys = getCurrentKeys();

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center gap-3 mb-6">
          <CreditCard className="h-6 w-6 text-blue-600" />
          <h2 className="text-xl font-semibold text-gray-800">
            Configurações do Stripe
          </h2>
        </div>

        <div className="space-y-6">
          {/* Modo de Operação */}
          <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
            <h3 className="font-medium text-gray-800 mb-4">Modo de Operação</h3>
            <p className="text-sm text-gray-600 mb-4">
              Selecione o modo para configurar as chaves correspondentes. Ambos os modos podem ter chaves salvas simultaneamente.
            </p>
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setFormData({...formData, is_test_mode: true})}
                className={`p-4 rounded-lg border-2 transition-all duration-200 ${
                  formData.is_test_mode
                    ? 'border-blue-600 bg-blue-50 text-blue-700'
                    : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50'
                }`}
              >
                <div className="text-center">
                  <div className="font-semibold mb-1">Modo de Teste</div>
                  <div className="text-sm opacity-75">Use chaves pk_test_ e sk_test_</div>
                  <div className="text-xs mt-1">
                    {formData.test_publishable_key ? '✅ Configurado' : '⚠️ Não configurado'}
                  </div>
                </div>
              </button>
              
              <button
                type="button"
                onClick={() => setFormData({...formData, is_test_mode: false})}
                className={`p-4 rounded-lg border-2 transition-all duration-200 ${
                  !formData.is_test_mode
                    ? 'border-green-600 bg-green-50 text-green-700'
                    : 'border-gray-200 hover:border-green-300 hover:bg-green-50'
                }`}
              >
                <div className="text-center">
                  <div className="font-semibold mb-1">Modo de Produção</div>
                  <div className="text-sm opacity-75">Use chaves pk_live_ e sk_live_</div>
                  <div className="text-xs mt-1">
                    {formData.prod_publishable_key ? '✅ Configurado' : '⚠️ Não configurado'}
                  </div>
                </div>
              </button>
            </div>
            
            <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded">
              <p className="text-xs text-yellow-800">
                <strong>Atenção:</strong> {formData.is_test_mode 
                  ? 'Em modo de teste, nenhum pagamento real será processado.'
                  : 'Em modo de produção, pagamentos reais serão processados e cobrados.'
                }
              </p>
            </div>
          </div>

          {/* PIX */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div>
              <h3 className="font-medium text-gray-800">Habilitar PIX</h3>
              <p className="text-sm text-gray-600">
                Permite pagamentos via PIX (requer configuração adicional no Stripe)
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={formData.pix_enabled}
                onChange={(e) => setFormData({...formData, pix_enabled: e.target.checked})}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          {/* Chave Pública */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Chave Pública {formData.is_test_mode ? '(Teste)' : '(Produção)'}
            </label>
            <div className="relative">
              <Key className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
              <input
                type="text"
                value={currentKeys.publishable_key}
                onChange={(e) => updateCurrentKeys('publishable_key', e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder={formData.is_test_mode ? "pk_test_..." : "pk_live_..."}
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Esta chave é segura para uso no frontend
            </p>
          </div>

          {/* Chave Secreta */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Chave Secreta {formData.is_test_mode ? '(Teste)' : '(Produção)'}
            </label>
            <div className="relative">
              <Key className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
              <input
                type="password"
                value={currentKeys.secret_key}
                onChange={(e) => updateCurrentKeys('secret_key', e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder={formData.is_test_mode ? "sk_test_..." : "sk_live_..."}
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Esta chave deve ser mantida em segredo
            </p>
          </div>

          {/* Webhook Secret */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Webhook Secret {formData.is_test_mode ? '(Teste)' : '(Produção)'}
            </label>
            <div className="relative">
              <Settings className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
              <input
                type="password"
                value={currentKeys.webhook_secret}
                onChange={(e) => updateCurrentKeys('webhook_secret', e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="whsec_..."
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Usado para verificar webhooks do Stripe
            </p>
          </div>

          {/* Teste de Conexão */}
          <div className="border-t pt-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-medium text-gray-800">Teste de Conexão</h3>
              {testResult && (
                <div className={`flex items-center gap-2 ${
                  testResult === 'success' ? 'text-green-600' : 'text-red-600'
                }`}>
                  {testResult === 'success' ? (
                    <>
                      <CheckCircle className="h-5 w-5" />
                      <span className="text-sm">Conexão bem-sucedida</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="h-5 w-5" />
                      <span className="text-sm">Erro na conexão</span>
                    </>
                  )}
                </div>
              )}
            </div>
            
            <button
              onClick={testStripeConnection}
              disabled={testing || !currentKeys.publishable_key || !currentKeys.secret_key}
              className="w-full bg-gray-100 text-gray-700 py-3 px-4 rounded-lg font-medium hover:bg-gray-200 disabled:bg-gray-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
            >
              {testing ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-600"></div>
                  Testando conexão...
                </>
              ) : (
                <>
                  <AlertCircle className="h-5 w-5" />
                  Testar Conexão
                </>
              )}
            </button>
          </div>

          {/* Ferramentas de Teste */}
          {formData.is_test_mode && (
            <div className="border-t pt-6">
              <h3 className="font-medium text-gray-800 mb-4">Ferramentas de Teste</h3>
              <div className="space-y-3">
                <button
                  onClick={simulateTestPayment}
                  disabled={simulatingPayment}
                  className="w-full bg-green-100 text-green-700 py-3 px-4 rounded-lg font-medium hover:bg-green-200 disabled:bg-green-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                >
                  {simulatingPayment ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-green-600"></div>
                      Criando doação de teste...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-5 w-5" />
                      Simular Doação Concluída
                    </>
                  )}
                </button>
                
                <button
                  onClick={updateAllPendingToCompleted}
                  className="w-full bg-yellow-100 text-yellow-700 py-3 px-4 rounded-lg font-medium hover:bg-yellow-200 transition-colors flex items-center justify-center gap-2"
                >
                  <AlertCircle className="h-5 w-5" />
                  Marcar Pendentes como Concluídas
                </button>
                
                <button
                  onClick={testWebhookConnection}
                  className="w-full bg-purple-100 text-purple-700 py-3 px-4 rounded-lg font-medium hover:bg-purple-200 transition-colors flex items-center justify-center gap-2"
                >
                  <Settings className="h-5 w-5" />
                  Testar URL do Webhook
                </button>
              </div>
              
              <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded">
                <p className="text-xs text-blue-800">
                  <strong>Modo de Teste:</strong> Use estas ferramentas para simular transações e testar o sistema.
                  Em produção, os status são atualizados automaticamente pelos webhooks do Stripe.
                </p>
              </div>
            </div>
          )}

          {/* Botões de Ação */}
          <div className="flex gap-4 pt-6 border-t">
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 bg-blue-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
            >
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Salvando...
                </>
              ) : (
                'Salvar Configurações'
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Instruções */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="font-medium text-blue-800 mb-3">Como configurar o Stripe:</h3>
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded">
          <p className="text-sm text-green-800">
            <strong>Novo Sistema:</strong> Agora você pode salvar chaves de teste e produção simultaneamente. 
            Alterne entre os modos para configurar cada conjunto de chaves separadamente.
          </p>
        </div>
        <ol className="list-decimal list-inside space-y-2 text-sm text-blue-700">
          <li>Acesse o <a href="https://dashboard.stripe.com" target="_blank" rel="noopener noreferrer" className="underline">Dashboard do Stripe</a></li>
          <li>Vá em "Developers" → "API keys" e alterne entre Test/Live no topo</li>
          <li>Configure primeiro as chaves de TESTE, depois as de PRODUÇÃO</li>
          <li>Copie as chaves correspondentes ao modo selecionado</li>
          <li>Para webhooks, vá em "Developers" → "Webhooks"</li>
          <li>Crie endpoints separados para teste e produção</li>
          <li>Selecione eventos: checkout.session.completed, payment_intent.succeeded, payment_intent.payment_failed</li>
          <li>Copie os "Signing secrets" correspondentes</li>
          <li>Salve as configurações e teste cada modo separadamente</li>
        </ol>
        
        <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
          <p className="text-xs text-yellow-800">
            <strong>Importante:</strong> Configure ambos os modos. Use teste durante desenvolvimento 
            e alterne para produção quando estiver pronto para receber pagamentos reais.
          </p>
        </div>
        
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded">
          <p className="text-xs text-red-800">
            <strong>Alternância de Modos:</strong> Ao alternar entre teste e produção, o sistema 
            automaticamente usa as chaves correspondentes. Ambas ficam salvas no banco de dados.
          </p>
        </div>
      </div>
    </div>
  );
};

export default StripeSettings;
