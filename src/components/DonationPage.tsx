import React, { useState } from 'react';
import { Heart, CreditCard, User, Mail, Phone, Smartphone } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { createCardPayment, createPixPayment, redirectToCheckout } from '../lib/stripe';
import Header from './Header';
import Footer from './Footer';

export default function DonationPage() {
  const navigate = useNavigate();
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const [customAmount, setCustomAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'pix'>('card');
  const [processing, setProcessing] = useState(false);
  const [donorInfo, setDonorInfo] = useState({
    name: '',
    email: '',
    phone: '',
    message: ''
  });

  // Scroll to top when component mounts
  React.useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    
    // Debug das variáveis de ambiente no carregamento da página
    console.log('=== DEBUG DONATION PAGE ===');
    console.log('VITE_SUPABASE_URL:', import.meta.env.VITE_SUPABASE_URL ? 'Definida' : 'NÃO DEFINIDA');
    console.log('VITE_SUPABASE_ANON_KEY:', import.meta.env.VITE_SUPABASE_ANON_KEY ? 'Definida' : 'NÃO DEFINIDA');
    console.log('Modo:', import.meta.env.MODE);
    console.log('Produção:', import.meta.env.PROD);
    console.log('Todas as variáveis:', Object.keys(import.meta.env));
  }, []);

  const predefinedAmounts = [25, 50, 100, 250, 500, 1000];

  const handleAmountSelect = (amount: number) => {
    setSelectedAmount(amount);
    setCustomAmount('');
  };

  const handleCustomAmountChange = (value: string) => {
    setCustomAmount(value);
    setSelectedAmount(null);
  };

  const formatPhone = (value: string) => {
    // Remove todos os caracteres não numéricos
    const numbers = value.replace(/\D/g, '');
    
    // Aplica a máscara (00) 00000-0000
    if (numbers.length <= 2) {
      return `(${numbers}`;
    } else if (numbers.length <= 7) {
      return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`;
    } else {
      return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7, 11)}`;
    }
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhone(e.target.value);
    setDonorInfo({...donorInfo, phone: formatted});
  };

  const getFinalAmount = (): number => {
    return selectedAmount || parseFloat(customAmount) || 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = getFinalAmount();
    
    if (amount > 0 && donorInfo.name && donorInfo.email) {
      setProcessing(true);

      // Separar fluxos de pagamento
      if (paymentMethod === 'card') {
        await handleCardPayment(amount);
      } else {
        await handlePixPayment(amount);
      }
    } else {
      alert('Por favor, preencha todos os campos obrigatórios e selecione um valor.');
    }
  };

  const handleCardPayment = async (amount: number) => {
    try {
      console.log('Iniciando pagamento com cartão...');
      
      const paymentData = {
        amount,
        donor_name: donorInfo.name,
        donor_email: donorInfo.email,
        donor_phone: donorInfo.phone,
        message: donorInfo.message
      };

      const paymentResult = await createCardPayment(paymentData);
      
      if (!paymentResult.session_id) {
        throw new Error('Erro ao criar sessão de pagamento');
      }

      console.log('Sessão criada, redirecionando para Stripe...');
      await redirectToCheckout(paymentResult.session_id);
      
    } catch (error) {
      console.error('Erro no pagamento com cartão:', error);
      handlePaymentError(error, 'cartão');
    } finally {
      setProcessing(false);
    }
  };

  const handlePixPayment = async (amount: number) => {
    try {
      console.log('Iniciando pagamento PIX...');
      
      const paymentData = {
        amount,
        donor_name: donorInfo.name,
        donor_email: donorInfo.email,
        donor_phone: donorInfo.phone,
        message: donorInfo.message
      };

      const pixResult = await createPixPayment(paymentData);
      
      console.log('PIX criado, redirecionando...');
      navigate('/obrigado', { 
        state: { 
          amount, 
          donorName: donorInfo.name,
          paymentMethod: 'pix',
          pixQrCode: pixResult.pix_qr_code,
          donationId: pixResult.donation_id
        } 
      });
      
    } catch (error) {
      console.error('Erro no pagamento PIX:', error);
      handlePaymentError(error, 'PIX');
    } finally {
      setProcessing(false);
    }
  };

  const handlePaymentError = (error: any, paymentType: string) => {
    let errorMessage = `Erro ao processar pagamento via ${paymentType}. Tente novamente em alguns minutos.`;
    
    if (error.message.includes('temporariamente indisponível') ||
        error.message.includes('variáveis de ambiente') ||
        error.message.includes('não configurado') || 
        error.message.includes('STRIPE_NOT_CONFIGURED') ||
        error.message.includes('Configure as chaves') ||
        error.message.includes('Entre em contato com o administrador')) {
      errorMessage = 'Sistema de pagamento temporariamente indisponível. As configurações estão sendo atualizadas. Entre em contato conosco pelo telefone (11) 2031-2100 ou tente novamente em alguns minutos.';
    } else if (error.message.includes('PIX não configurado') || 
               error.message.includes('PIX não habilitado')) {
      errorMessage = 'PIX não está configurado. Tente pagamento com cartão ou entre em contato com o administrador.';
    } else if (error.message.includes('406') || 
               error.message.includes('temporariamente indisponível')) {
      errorMessage = 'Sistema de pagamento temporariamente indisponível. Entre em contato conosco pelo telefone (11) 2031-2100.';
    } else if (error.message.includes('401') || error.message.includes('403')) {
      errorMessage = 'Erro de autenticação no sistema de pagamento. Entre em contato conosco pelo telefone (11) 2031-2100.';
    } else if (error.message.includes('400')) {
      errorMessage = 'Dados inválidos. Verifique os campos preenchidos.';
    }
    
    alert(errorMessage);
  };

  const handleTestDonation = () => {
    // Função para testar sem Stripe (desenvolvimento)
    const amount = getFinalAmount();
    
    if (amount > 0 && donorInfo.name && donorInfo.email) {
      navigate('/obrigado', { 
        state: { 
          amount, 
          donorName: donorInfo.name,
          paymentMethod: 'card',
          status: 'completed'
        } 
      });
    }
  };

  return (
    <>
    <div className="min-h-screen pt-8 pb-12 bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <Heart className="h-16 w-16 mx-auto text-blue-600 mb-4" />
          <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">
            Faça sua Doação
          </h1>
          <p className="text-lg text-gray-600">
            Contribua para a construção da Casa de Acolhimento Dom Fernando Legal
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <form onSubmit={handleSubmit} className="p-4 sm:p-8">
            {/* Método de Pagamento */}
            <div className="mb-8">
              <h3 className="text-xl font-semibold text-gray-800 mb-6">
                Escolha o método de pagamento
              </h3>
              
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('card')}
                  className={`p-4 rounded-lg border-2 transition-all duration-200 flex items-center justify-center gap-3 ${
                    paymentMethod === 'card'
                      ? 'border-blue-600 bg-blue-50 text-blue-700'
                      : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50'
                  }`}
                >
                  <CreditCard className="h-6 w-6" />
                  <span className="font-medium">Cartão de Crédito</span>
                </button>
                
                <button
                  type="button"
                  onClick={() => setPaymentMethod('pix')}
                  className={`p-4 rounded-lg border-2 transition-all duration-200 flex items-center justify-center gap-3 ${
                    paymentMethod === 'pix'
                      ? 'border-blue-600 bg-blue-50 text-blue-700'
                      : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50'
                  }`}
                >
                  <Smartphone className="h-6 w-6" />
                  <span className="font-medium">PIX</span>
                </button>
              </div>
            </div>

            {/* Valor da Doação */}
            <div className="mb-8">
              <h3 className="text-xl font-semibold text-gray-800 mb-6">
                Escolha o valor da sua doação
              </h3>
              
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4 mb-6">
                {predefinedAmounts.map((amount) => (
                  <button
                    key={amount}
                    type="button"
                    onClick={() => handleAmountSelect(amount)}
                    className={`p-3 sm:p-4 rounded-lg border-2 transition-all duration-200 ${
                      selectedAmount === amount
                        ? 'border-blue-600 bg-blue-50 text-blue-700'
                        : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50'
                    }`}
                  >
                    <div className="text-lg sm:text-2xl font-bold">R$ {amount}</div>
                  </button>
                ))}
              </div>

              <div className="relative">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Outro valor (R$)
                </label>
                <input
                  type="number"
                  min="1"
                  step="0.01"
                  value={customAmount}
                  onChange={(e) => handleCustomAmountChange(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  placeholder="Digite um valor personalizado"
                />
              </div>
            </div>

            {/* Informações do Doador */}
            <div className="mb-8">
              <h3 className="text-xl font-semibold text-gray-800 mb-6">
                Suas informações
              </h3>
              
              <div className="grid sm:grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nome completo *
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                    <input
                      type="text"
                      required
                      value={donorInfo.name}
                      onChange={(e) => setDonorInfo({...donorInfo, name: e.target.value})}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-base"
                      placeholder="Seu nome completo"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    E-mail *
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                    <input
                      type="email"
                      required
                      value={donorInfo.email}
                      onChange={(e) => setDonorInfo({...donorInfo, email: e.target.value})}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-base"
                      placeholder="seu@email.com"
                    />
                  </div>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Telefone
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                    <input
                      type="tel"
                      value={donorInfo.phone}
                      onChange={handlePhoneChange}
                      maxLength={15}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-base"
                      placeholder="(00) 00000-0000"
                    />
                  </div>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Mensagem (opcional)
                  </label>
                  <textarea
                    rows={3}
                    value={donorInfo.message}
                    onChange={(e) => setDonorInfo({...donorInfo, message: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors resize-none text-base"
                    placeholder="Deixe uma mensagem de apoio..."
                  />
                </div>
              </div>
            </div>

            {/* Resumo */}
            <div className="bg-gray-50 rounded-lg p-4 sm:p-6 mb-8">
              <h4 className="text-lg font-semibold text-gray-800 mb-4">
                Resumo da Doação
              </h4>
              <div className="flex justify-between items-center text-xl sm:text-2xl font-bold">
                <span>Total:</span>
                <span className="text-blue-600">
                  R$ {getFinalAmount().toFixed(2).replace('.', ',')}
                </span>
              </div>
            </div>

            {/* Botões de Pagamento */}
            <div className="space-y-4">
              <button
                type="submit"
                disabled={getFinalAmount() === 0 || !donorInfo.name || !donorInfo.email || processing}
                className="w-full bg-blue-600 text-white py-4 px-8 rounded-lg text-base sm:text-lg font-semibold hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
              >
                {processing ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    Processando...
                  </>
                ) : (
                  <>
                    {paymentMethod === 'card' ? <CreditCard className="h-5 w-5" /> : <Smartphone className="h-5 w-5" />}
                    {paymentMethod === 'card' ? 'Pagar com Cartão' : 'Pagar com PIX'}
                  </>
                )}
              </button>
              
            </div>

            <div className="mt-4 space-y-2">
              <p className="text-xs sm:text-sm text-gray-500 text-center">
              {paymentMethod === 'card' 
                ? 'Pagamento seguro processado via Stripe. Seus dados estão protegidos.'
                : 'PIX instantâneo. Você receberá o código QR na próxima tela.'
              }
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
    </>
  );
}