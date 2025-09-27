import React from 'react';
import { Heart, Home, Users, Star, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase, DonorMessage, CampaignStats } from '../lib/supabase';
import Header from './Header';
import Footer from './Footer';

const HomePage: React.FC = () => {
  const [donorMessages, setDonorMessages] = React.useState<DonorMessage[]>([]);
  const [campaignStats, setCampaignStats] = React.useState<CampaignStats>({
    goal_amount: 500000,
    title: 'Casa de Acolhimento Dom Fernando Legal',
    description: 'Ajude-nos a construir a Casa de Acolhimento Dom Fernando Legal',
    total_donated: 0,
    percentage_completed: 0
  });

  React.useEffect(() => {
    loadDonorMessages();
    loadCampaignStats();
  }, []);

  const loadDonorMessages = async () => {
    try {
      const { data } = await supabase
        .from('donor_messages')
        .select('*')
        .eq('is_approved', true)
        .order('created_at', { ascending: false })
        .limit(6);
      
      if (data) {
        setDonorMessages(data);
      }
    } catch (error) {
      console.error('Error loading donor messages:', error);
    }
  };

  const loadCampaignStats = async () => {
    try {
      const { data, error } = await supabase
        .rpc('get_campaign_settings')
        .single();
      
      if (error) {
        console.error('Error loading campaign stats:', error);
        return;
      }
      
      if (data) {
        setCampaignStats({
          goal_amount: data.goal_amount,
          title: data.title,
          description: data.description,
          total_donated: data.total_donated,
          percentage_completed: data.percentage_completed
        });
      }
    } catch (error) {
      console.error('Error loading campaign stats:', error);
    }
  };

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Há poucos minutos';
    if (diffInHours < 24) return `Há ${diffInHours} hora${diffInHours > 1 ? 's' : ''}`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    return `Há ${diffInDays} dia${diffInDays > 1 ? 's' : ''}`;
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const getRandomColor = (index: number) => {
    const colors = [
      'bg-blue-600', 'bg-green-600', 'bg-purple-600', 
      'bg-orange-600', 'bg-indigo-600', 'bg-teal-600'
    ];
    return colors[index % colors.length];
  };

  return (
    <>
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="mb-8">
            <Heart className="h-16 w-16 mx-auto mb-4 text-blue-200" />
            <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
              {campaignStats.title.split(' ').slice(0, 3).join(' ')}<br />
              <span className="text-blue-200">{campaignStats.title.split(' ').slice(3).join(' ')}</span>
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-blue-100 max-w-3xl mx-auto leading-relaxed">
              {campaignStats.description}
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link 
              to="/doacao"
              className="bg-white text-blue-800 px-8 py-4 rounded-full text-lg font-semibold hover:bg-blue-50 transition-all duration-300 transform hover:scale-105 shadow-lg flex items-center gap-2"
            >
              Fazer Doação <Heart className="h-5 w-5" />
            </Link>
            <button className="border-2 border-white text-white px-8 py-4 rounded-full text-lg font-semibold hover:bg-white hover:text-blue-800 transition-all duration-300">
              <Link to="/projeto">Conhecer o Projeto</Link>
            </button>
          </div>
        </div>
      </section>

      {/* Progress Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">
              Meta da Campanha
            </h2>
            <p className="text-lg text-gray-600">
              Acompanhe o progresso da nossa campanha de construção
            </p>
          </div>
          
          <div className="max-w-4xl mx-auto">
            <div className="bg-gray-100 rounded-2xl p-8">
              <div className="grid md:grid-cols-3 gap-8 text-center mb-8">
                <div>
                  <div className="text-3xl font-bold text-blue-600">
                    R$ {campaignStats.total_donated.toLocaleString('pt-BR', { 
                      minimumFractionDigits: 2, 
                      maximumFractionDigits: 2 
                    })}
                  </div>
                  <div className="text-gray-600">Arrecadado</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-gray-800">
                    R$ {campaignStats.goal_amount.toLocaleString('pt-BR', { 
                      minimumFractionDigits: 2, 
                      maximumFractionDigits: 2 
                    })}
                  </div>
                  <div className="text-gray-600">Meta Total</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-green-600">
                    {campaignStats.percentage_completed}%
                  </div>
                  <div className="text-gray-600">Concluído</div>
                </div>
              </div>
              
              <div className="w-full bg-gray-300 rounded-full h-4 mb-4">
                <div 
                  className="bg-gradient-to-r from-blue-500 to-blue-600 h-4 rounded-full" 
                  style={{width: `${Math.min(campaignStats.percentage_completed, 100)}%`}}
                ></div>
              </div>
              
              <p className="text-center text-gray-600">
                Sua contribuição nos ajuda a chegar mais perto do nosso objetivo!
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-6">
                Casa de Acolhimento Dom Fernando Legal
              </h2>
              <p className="text-lg text-gray-600 mb-6 leading-relaxed">
                A Casa de Acolhimento Dom Fernando Legal é um projeto da Diocese de São Miguel Paulista dedicado 
                a proporcionar cuidados especializados e um ambiente acolhedor para sacerdotes 
                que dedicaram suas vidas ao serviço da Igreja e da comunidade católica.
              </p>
              <p className="text-lg text-gray-600 mb-8 leading-relaxed">
                Localizada na região de São Miguel Paulista, zona leste de São Paulo, nossa casa será 
                equipada com todas as facilidades necessárias para garantir qualidade de vida, 
                cuidados médicos especializados e um ambiente de paz e fraternidade sacerdotal.
              </p>
              
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="bg-blue-100 p-2 rounded-full">
                    <Home className="h-5 w-5 text-blue-600" />
                  </div>
                  <span className="text-gray-700">Quartos individuais com banheiro adaptado</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="bg-blue-100 p-2 rounded-full">
                    <Users className="h-5 w-5 text-blue-600" />
                  </div>
                  <span className="text-gray-700">Enfermagem 24 horas especializada</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="bg-blue-100 p-2 rounded-full">
                    <Star className="h-5 w-5 text-blue-600" />
                  </div>
                  <span className="text-gray-700">Capela e espaços de convivência</span>
                </div>
              </div>
            </div>
            
            <div className="relative">
              <div className="bg-gradient-to-br from-blue-100 to-blue-200 rounded-2xl p-8 h-96 flex items-center justify-center">
                <div className="text-center">
                  <Home className="h-24 w-24 text-blue-600 mx-auto mb-4" />
                  <p className="text-blue-800 font-semibold text-lg">
                    Projeto da Casa de Acolhimento Dom Fernando Legal
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Recent Donors Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">
              Mensagens dos Nossos Apoiadores
            </h2>
            <p className="text-lg text-gray-600">
              Veja as palavras de carinho e apoio de quem já contribuiu com nossa causa
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {donorMessages.length > 0 ? (
              donorMessages.map((message, index) => (
                <div key={message.id} className={`bg-${getRandomColor(index).split('-')[1]}-50 rounded-lg p-6 border-l-4 border-${getRandomColor(index).split('-')[1]}-600`}>
                  <div className="flex items-center mb-3">
                    <div className={`${getRandomColor(index)} rounded-full w-10 h-10 flex items-center justify-center text-white font-bold`}>
                      {getInitials(message.donor_name)}
                    </div>
                    <div className="ml-3">
                      <h4 className="font-semibold text-gray-800">{message.donor_name}</h4>
                      <p className="text-sm text-gray-500">{getTimeAgo(message.created_at)}</p>
                    </div>
                  </div>
                  <p className="text-gray-700 italic">"{message.message}"</p>
                </div>
              ))
            ) : (
              // Mensagens padrão caso não haja mensagens no banco
              <>
                <div className="bg-blue-50 rounded-lg p-6 border-l-4 border-blue-600">
                  <div className="flex items-center mb-3">
                    <div className="bg-blue-600 rounded-full w-10 h-10 flex items-center justify-center text-white font-bold">
                      M
                    </div>
                    <div className="ml-3">
                      <h4 className="font-semibold text-gray-800">Maria Silva</h4>
                      <p className="text-sm text-gray-500">Há 2 horas</p>
                    </div>
                  </div>
                  <p className="text-gray-700 italic">
                    "Que Deus abençoe esse projeto maravilhoso. Os padres merecem todo nosso carinho e cuidado."
                  </p>
                </div>

                <div className="bg-green-50 rounded-lg p-6 border-l-4 border-green-600">
                  <div className="flex items-center mb-3">
                    <div className="bg-green-600 rounded-full w-10 h-10 flex items-center justify-center text-white font-bold">
                      J
                    </div>
                    <div className="ml-3">
                      <h4 className="font-semibold text-gray-800">João Santos</h4>
                      <p className="text-sm text-gray-500">Há 5 horas</p>
                    </div>
                  </div>
                  <p className="text-gray-700 italic">
                    "Apoio total a essa causa nobre. Que possamos construir um lar digno para nossos padres."
                  </p>
                </div>

                <div className="bg-purple-50 rounded-lg p-6 border-l-4 border-purple-600">
                  <div className="flex items-center mb-3">
                    <div className="bg-purple-600 rounded-full w-10 h-10 flex items-center justify-center text-white font-bold">
                      A
                    </div>
                    <div className="ml-3">
                      <h4 className="font-semibold text-gray-800">Ana Costa</h4>
                      <p className="text-sm text-gray-500">Há 1 dia</p>
                    </div>
                  </div>
                  <p className="text-gray-700 italic">
                    "Minha família sempre foi acolhida pela igreja. Agora é nossa vez de retribuir."
                  </p>
                </div>
              </>
            )}
          </div>

          <div className="text-center mt-8">
            <p className="text-gray-600 mb-4">
              Junte-se a esses apoiadores e faça parte desta corrente do bem
            </p>
            <Link 
              to="/doacao"
              className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-full font-semibold hover:bg-blue-700 transition-colors"
            >
              <Heart className="h-4 w-4" />
              Deixar Minha Mensagem
            </Link>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-16 bg-blue-600 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Sua Doação Faz a Diferença
          </h2>
          <p className="text-xl mb-8 text-blue-100 leading-relaxed">
            Cada contribuição, por menor que seja, nos aproxima do objetivo de construir 
            um lar digno para aqueles que dedicaram suas vidas ao próximo.
          </p>
          <Link 
            to="/doacao"
            className="inline-flex items-center gap-2 bg-white text-blue-600 px-8 py-4 rounded-full text-lg font-semibold hover:bg-blue-50 transition-all duration-300 transform hover:scale-105 shadow-lg"
          >
            Contribuir Agora <ArrowRight className="h-5 w-5" />
          </Link>
        </div>
      </section>
    </>
  );
};

export default HomePage;