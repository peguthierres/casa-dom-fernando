import React from 'react';
import { CheckCircle, Heart, Home, ArrowLeft } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import Header from './Header';
import Footer from './Footer';

const ThankYouPage: React.FC = () => {
  const location = useLocation();
  const [donationData, setDonationData] = React.useState({
    amount: 0,
    donorName: 'Doador',
    paymentMethod: 'card',
    pixQrCode: null,
    status: 'completed'
  });
  const [loading, setLoading] = React.useState(false);

  // Scroll to top when component mounts
  React.useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    
    // Verificar se veio do Stripe Checkout
    const urlParams = new URLSearchParams(window.location.search);
    const sessionId = urlParams.get('session_id');
    
    if (sessionId) {
      // Buscar dados da doação pelo session_id
      loadDonationData(sessionId);
    } else if (location.state) {
      // Usar dados do state (PIX)
      setDonationData({
        amount: location.state.amount || 0,
        donorName: location.state.donorName || 'Doador',
        paymentMethod: location.state.paymentMethod || 'card',
        pixQrCode: location.state.pixQrCode || null,
        status: location.state.paymentMethod === 'pix' ? 'pending' : 'completed'
      });
    } else {
      // Se não há dados de doação, redirecionar para página de doação
      console.log('Nenhum dado de doação encontrado, redirecionando...');
      setTimeout(() => {
        window.location.href = '/doacao';
      }, 3000);
    }
  }, []);
  
  const loadDonationData = async (sessionId: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('donations')
        .select('*')
        .eq('stripe_session_id', sessionId)
        .single();
      
      if (error) throw error;
      
      if (data) {
        setDonationData({
          amount: data.amount,
          donorName: data.donor_name,
          paymentMethod: data.payment_method,
          pixQrCode: null,
          status: data.status
        });
      }
    } catch (error) {
      console.error('Error loading donation data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando informações da doação...</p>
        </div>
      </div>
    );
  }

  // Se não há dados de doação válidos, mostrar mensagem de redirecionamento
  if (!donationData.amount || donationData.amount < 1) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-yellow-50 to-orange-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="text-6xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-gray-800 mb-4">
            Nenhuma doação encontrada
          </h1>
          <p className="text-gray-600 mb-6">
            Não encontramos informações sobre sua doação. Você será redirecionado para a página de doações.
          </p>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600 mx-auto mb-4"></div>
          <p className="text-sm text-gray-500">Redirecionando em alguns segundos...</p>
        </div>
      </div>
    );
  }
  return (
    <>
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 pt-8 pb-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <div className="mb-8">
            <CheckCircle className="h-24 w-24 text-green-500 mx-auto mb-6" />
            <h1 className="text-3xl md:text-5xl font-bold text-gray-800 mb-4">
              Muito Obrigado!
            </h1>
            <p className="text-lg md:text-xl text-gray-600 mb-6">
              {donationData.donorName}, sua doação foi processada com sucesso
            </p>
            
            {donationData.paymentMethod === 'pix' && donationData.pixQrCode && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                <h3 className="font-semibold text-yellow-800 mb-2">
                  Pagamento PIX Pendente
                </h3>
                <p className="text-yellow-700 text-sm mb-4">
                  Escaneie o QR Code abaixo ou use o código PIX para completar o pagamento
                </p>
                <div className="bg-white p-4 rounded-lg text-center">
                  <div className="bg-gray-200 h-48 w-48 mx-auto rounded-lg flex items-center justify-center mb-4">
                    <span className="text-gray-500">{donationData.pixQrCode || 'QR Code PIX'}</span>
                  </div>
                  <p className="text-xs text-gray-500">
                    O pagamento será confirmado automaticamente após o PIX
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-4 sm:p-8 mb-8">
            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div className="text-center md:text-left">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-4">
                  Detalhes da Doação
                </h2>
                <div className="space-y-3 text-base sm:text-lg">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Valor doado:</span>
                    <span className="font-bold text-green-600">
                      R$ {donationData.amount.toFixed(2).replace('.', ',')}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Data:</span>
                    <span className="font-semibold">
                      {new Date().toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Status:</span>
                    <span className={`font-semibold ${
                      donationData.status === 'pending' ? 'text-yellow-600' : 'text-green-600'
                    }`}>
                      {donationData.status === 'pending' ? 'Aguardando Pagamento' : 'Confirmado'}
                    </span>
                  </div>
                </div>
                
                <p className="text-sm text-gray-500 mt-4">
                  {donationData.status === 'pending'
                    ? 'Após o pagamento do PIX, você receberá a confirmação por e-mail.'
                    : 'Você receberá um comprovante por e-mail em breve.'
                  }
                </p>
              </div>

              <div className="text-center">
                <Heart className="h-20 w-20 text-blue-600 mx-auto mb-4" />
                <h3 className="text-lg sm:text-xl font-bold text-gray-800 mb-2">
                  Sua Contribuição Importa
                </h3>
                <p className="text-gray-600">
                  Graças à sua generosidade, estamos mais próximos 
                  de construir um lar digno para nossos padres idosos.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-blue-600 text-white rounded-2xl p-4 sm:p-8 mb-8">
            <h2 className="text-xl sm:text-2xl font-bold mb-6">
              O Que Acontece Agora?
            </h2>
            
            <div className="grid sm:grid-cols-1 md:grid-cols-3 gap-6 text-center">
              <div>
                <div className="bg-white bg-opacity-20 rounded-full p-3 w-16 h-16 mx-auto mb-3 flex items-center justify-center">
                  <span className="text-2xl font-bold">1</span>
                </div>
                <h4 className="font-semibold mb-2">Confirmação</h4>
                <p className="text-blue-100">
                  Você receberá um e-mail de confirmação com os detalhes da sua doação
                </p>
              </div>
              
              <div>
                <div className="bg-white bg-opacity-20 rounded-full p-3 w-16 h-16 mx-auto mb-3 flex items-center justify-center">
                  <span className="text-2xl font-bold">2</span>
                </div>
                <h4 className="font-semibold mb-2">Aplicação</h4>
                <p className="text-blue-100">
                  Sua doação será direcionada para a construção da casa de repouso
                </p>
              </div>
              
              <div>
                <div className="bg-white bg-opacity-20 rounded-full p-3 w-16 h-16 mx-auto mb-3 flex items-center justify-center">
                  <span className="text-2xl font-bold">3</span>
                </div>
                <h4 className="font-semibold mb-2">Atualizações</h4>
                <p className="text-blue-100">
                  Manteremos você informado sobre o progresso da obra
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg sm:text-xl font-bold text-gray-800 mb-4">
              Gostaria de Ajudar Ainda Mais?
            </h3>
            
            <div className="grid sm:grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white rounded-lg p-6 shadow-md">
                <Home className="h-8 w-8 text-blue-600 mb-3" />
                <h4 className="font-semibold text-gray-800 mb-2">
                  Compartilhe Nossa Causa
                </h4>
                <p className="text-gray-600 text-sm mb-4">
                  Ajude-nos a alcançar mais pessoas compartilhando nosso projeto
                </p>
                <button className="text-blue-600 font-semibold hover:text-blue-700">
                  Compartilhar →
                </button>
              </div>
              
              <div className="bg-white rounded-lg p-6 shadow-md">
                <Heart className="h-8 w-8 text-blue-600 mb-3" />
                <h4 className="font-semibold text-gray-800 mb-2">
                  Doe Mensalmente
                </h4>
                <p className="text-gray-600 text-sm mb-4">
                  Torne-se um apoiador recorrente e multiplique seu impacto
                </p>
                <button className="text-blue-600 font-semibold hover:text-blue-700">
                  Saber Mais →
                </button>
              </div>
            </div>
          </div>

          <div className="mt-12">
            <Link 
              to="/"
              className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 sm:px-8 py-3 rounded-full font-semibold hover:bg-blue-700 transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
              Voltar ao Início
            </Link>
          </div>
        </div>
      </div>
    </div>
    </>
  );
};

export default ThankYouPage;
