import React, { useState } from 'react';
import { DollarSign, Users, TrendingUp, Calendar, Download, Eye, Upload, Trash2, Image as ImageIcon, Settings, LogOut, FileText, Target } from 'lucide-react';
import { supabase, Donation, ProjectImage, CampaignSettings } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';
import StripeSettings from './StripeSettings';
import TransactionModal from './TransactionModal';
import CampaignSettingsComponent from './CampaignSettingsComponent';

const AdminPanel: React.FC = () => {
  const navigate = useNavigate();
  const [selectedPeriod, setSelectedPeriod] = useState('month');
  const [activeTab, setActiveTab] = useState('transactions');
  const [donations, setDonations] = useState<Donation[]>([]);
  const [projectImages, setProjectImages] = useState<ProjectImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [campaignSettings, setCampaignSettings] = useState<CampaignSettings | null>(null);
  const [selectedDonation, setSelectedDonation] = useState<Donation | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newImage, setNewImage] = useState({
    title: '',
    description: '',
    image_url: ''
  });
  
  // Scroll to top when component mounts
  React.useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    checkAuth();
    loadData();
  }, []);
  
  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate('/login');
    }
  };

  const loadData = async () => {
    try {
      // Carregar doações
      const { data: donationsData, error: donationsError } = await supabase
        .from('donations')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (donationsError) {
        console.error('Error loading donations:', donationsError);
        // Continue with empty array instead of failing
        setDonations([]);
      } else {
      if (donationsData) {
        setDonations(donationsData);
      }
      }

      // Carregar imagens
      const { data: imagesData, error: imagesError } = await supabase
        .from('project_images')
        .select('*')
        .order('display_order', { ascending: true });
      
      if (imagesError) {
        console.error('Error loading images:', imagesError);
        // Continue with empty array instead of failing
        setProjectImages([]);
      } else {
      if (imagesData) {
        setProjectImages(imagesData);
      }
      }

      // Carregar configurações da campanha
      const { data: campaignData, error: campaignError } = await supabase
        .from('campaign_settings')
        .select('*')
        .eq('is_active', true)
        .single();
      
      if (campaignError) {
        console.error('Error loading campaign settings:', campaignError);
      } else if (campaignData) {
        setCampaignSettings(campaignData);
      }
    } catch (error) {
      console.error('Error loading data:', error);
      // Set empty arrays to prevent UI crashes
      setDonations([]);
      setProjectImages([]);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  const addImage = async () => {
    if (!newImage.title || !newImage.image_url) return;

    try {
      const { error } = await supabase
        .from('project_images')
        .insert([{
          title: newImage.title,
          description: newImage.description,
          image_url: newImage.image_url,
          display_order: projectImages.length + 1
        }]);

      if (error) throw error;

      setNewImage({ title: '', description: '', image_url: '' });
      loadData();
    } catch (error) {
      console.error('Error adding image:', error);
    }
  };

  const deleteImage = async (id: string) => {
    try {
      const { error } = await supabase
        .from('project_images')
        .delete()
        .eq('id', id);

      if (error) throw error;
      loadData();
    } catch (error) {
      console.error('Error deleting image:', error);
    }
  };

  const openTransactionModal = (donation: Donation) => {
    setSelectedDonation(donation);
    setIsModalOpen(true);
  };

  const closeTransactionModal = () => {
    setSelectedDonation(null);
    setIsModalOpen(false);
  };

  const exportTransactions = () => {
    const csvContent = generateCSVContent(donations);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `doacoes-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const totalArrecadado = donations
    .filter(t => t.status === 'completed')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalDoadores = new Set(
    donations
      .filter(t => t.status === 'completed')
      .map(t => t.donor_email)
  ).size;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed':
        return 'Concluída';
      case 'pending':
        return 'Pendente';
      case 'failed':
        return 'Falhou';
      default:
        return 'Desconhecido';
    }
  };

  return (
    <>
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8 flex justify-between items-start">
          <div>
          <h1 className="text-3xl font-bold text-gray-800">Painel Administrativo - Casa de Acolhimento Dom Fernando Legal</h1>
          <p className="text-gray-600 mt-2">
            Gerencie as doações, imagens do projeto e acompanhe o progresso da campanha
          </p>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
          >
            <LogOut className="h-4 w-4" />
            Sair
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="mb-8">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('transactions')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'transactions'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Transações
              </button>
              <button
                onClick={() => setActiveTab('images')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'images'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Galeria de Imagens
              </button>
              <button
                onClick={() => setActiveTab('settings')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'settings'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Configurações
              </button>
              <button
                onClick={() => setActiveTab('campaign')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'campaign'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Meta da Campanha
              </button>
            </nav>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <DollarSign className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Arrecadado</p>
                <p className="text-2xl font-bold text-gray-900">
                  R$ {totalArrecadado.toLocaleString('pt-BR')}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total de Doadores</p>
                <p className="text-2xl font-bold text-gray-900">{totalDoadores}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <TrendingUp className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Meta Atingida</p>
                <p className="text-2xl font-bold text-gray-900">
                  {campaignSettings ? 
                    Math.round((totalArrecadado / campaignSettings.goal_amount) * 100) : 0}%
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Calendar className="h-6 w-6 text-orange-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Este Mês</p>
                <p className="text-2xl font-bold text-gray-900">
                  R$ {Math.floor(totalArrecadado * 0.3).toLocaleString('pt-BR')}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Transactions Tab */}
        {activeTab === 'transactions' && (
          <>
            {/* Controls */}
            <div className="bg-white rounded-lg shadow mb-6">
              <div className="p-6 border-b border-gray-200">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <h2 className="text-xl font-semibold text-gray-800">
                    Transações Recentes
                  </h2>
                  
                  <div className="flex flex-col sm:flex-row gap-3">
                    <select
                      value={selectedPeriod}
                      onChange={(e) => setSelectedPeriod(e.target.value)}
                      className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="week">Última Semana</option>
                      <option value="month">Último Mês</option>
                      <option value="quarter">Último Trimestre</option>
                      <option value="year">Último Ano</option>
                    </select>
                    
                    <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                      <Download className="h-4 w-4" />
                      Exportar CSV
                    </button>
                    
                    <button 
                      onClick={exportTransactions}
                      className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                    >
                      <FileText className="h-4 w-4" />
                      Exportar Relatório
                    </button>
                  </div>
                </div>
              </div>

              {/* Transactions Table */}
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Doador
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Data
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Valor
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Método
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Ações
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {donations.map((donation) => (
                      <tr key={donation.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {donation.donor_name}
                            </div>
                            <div className="text-sm text-gray-500">
                              {donation.donor_email}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {new Date(donation.created_at).toLocaleDateString('pt-BR')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          R$ {donation.amount.toLocaleString('pt-BR')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {donation.payment_method === 'card' ? 'Cartão' : 'PIX'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(donation.status)}`}>
                            {getStatusText(donation.status)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <button 
                            onClick={() => openTransactionModal(donation)}
                            className="text-blue-600 hover:text-blue-800 mr-3"
                            title="Ver detalhes"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <button 
                            onClick={() => openTransactionModal(donation)}
                            className="text-gray-600 hover:text-gray-800"
                            title="Baixar comprovante"
                          >
                            <Download className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Messages Section */}
            <div className="bg-white rounded-lg shadow">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-800">
                  Mensagens dos Doadores
                </h3>
              </div>
              <div className="p-6 space-y-4">
                {donations
                  .filter(t => t.message && t.status === 'completed')
                  .map((donation) => (
                    <div key={donation.id} className="bg-gray-50 rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <span className="font-medium text-gray-900">
                          {donation.donor_name}
                        </span>
                        <span className="text-sm text-gray-500">
                          {new Date(donation.created_at).toLocaleDateString('pt-BR')}
                        </span>
                      </div>
                      <p className="text-gray-700 text-sm">"{donation.message}"</p>
                    </div>
                  ))}
              </div>
            </div>
          </>
        )}

        {/* Images Tab */}
        {activeTab === 'images' && (
          <>
            {/* Add New Image Form */}
            <div className="bg-white rounded-lg shadow mb-6">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-800">
                  Adicionar Nova Imagem
                </h2>
              </div>
              <div className="p-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Título da Imagem
                    </label>
                    <input
                      type="text"
                      value={newImage.title}
                      onChange={(e) => setNewImage({...newImage, title: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Ex: Início da Construção"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      URL da Imagem
                    </label>
                    <input
                      type="url"
                      value={newImage.image_url}
                      onChange={(e) => setNewImage({...newImage, image_url: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="https://exemplo.com/imagem.jpg"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Descrição
                    </label>
                    <textarea
                      rows={3}
                      value={newImage.description}
                      onChange={(e) => setNewImage({...newImage, description: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                      placeholder="Descreva a imagem..."
                    />
                  </div>
                </div>
                <div className="mt-6">
                  <button 
                    onClick={addImage}
                    className="flex items-center gap-2 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Upload className="h-4 w-4" />
                    Adicionar Imagem
                  </button>
                </div>
              </div>
            </div>

            {/* Images Gallery Management */}
            <div className="bg-white rounded-lg shadow">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-800">
                  Galeria de Imagens do Projeto
                </h2>
              </div>
              <div className="p-6">
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {projectImages.map((image) => (
                    <div key={image.id} className="bg-gray-50 rounded-lg overflow-hidden">
                      <div className="relative">
                        <img 
                          src={image.image_url} 
                          alt={image.title}
                          className="w-full h-48 object-cover"
                        />
                        <div className="absolute top-2 right-2 flex gap-2">
                          <button className="bg-white bg-opacity-90 p-1 rounded-full hover:bg-opacity-100 transition-colors">
                            <Eye className="h-4 w-4 text-gray-600" />
                          </button>
                          <button 
                            onClick={() => deleteImage(image.id)}
                            className="bg-red-500 bg-opacity-90 p-1 rounded-full hover:bg-opacity-100 transition-colors"
                          >
                            <Trash2 className="h-4 w-4 text-white" />
                          </button>
                        </div>
                      </div>
                      <div className="p-4">
                        <h3 className="font-semibold text-gray-800 mb-1">{image.title}</h3>
                        <p className="text-sm text-gray-600 mb-2">{image.description}</p>
                        <p className="text-xs text-gray-400">
                          {new Date(image.created_at).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
                
                {projectImages.length === 0 && (
                  <div className="text-center py-12">
                    <ImageIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">Nenhuma imagem adicionada ainda</p>
                  </div>
                )}
              </div>
            </div>
          </>
        )}

        {/* Settings Tab */}
        {activeTab === 'settings' && <StripeSettings />}

        {/* Campaign Settings Tab */}
        {activeTab === 'campaign' && (
          <CampaignSettingsComponent 
            settings={campaignSettings}
            onSettingsUpdate={(newSettings) => {
              setCampaignSettings(newSettings);
              loadData(); // Reload data to update stats
            }}
          />
        )}

        {/* Transaction Modal */}
        <TransactionModal
          donation={selectedDonation}
          isOpen={isModalOpen}
          onClose={closeTransactionModal}
        />
      </div>
    </div>
    </>
  );
};

const generateCSVContent = (donations: Donation[]): string => {
  const headers = [
    'ID',
    'Data',
    'Nome do Doador',
    'E-mail',
    'Telefone',
    'Valor',
    'Moeda',
    'Método de Pagamento',
    'Status',
    'Mensagem',
    'ID Stripe',
    'Atualizado em'
  ];

  const csvRows = [
    headers.join(','),
    ...donations.map(donation => [
      donation.id,
      new Date(donation.created_at).toLocaleDateString('pt-BR'),
      `"${donation.donor_name}"`,
      donation.donor_email,
      donation.donor_phone || '',
      donation.amount.toString().replace('.', ','),
      donation.currency,
      donation.payment_method === 'card' ? 'Cartão' : 'PIX',
      donation.status === 'completed' ? 'Concluída' : donation.status === 'pending' ? 'Pendente' : 'Falhou',
      `"${donation.message || ''}"`,
      donation.stripe_payment_intent_id || '',
      new Date(donation.updated_at).toLocaleDateString('pt-BR')
    ].join(','))
  ];
  return csvRows.join('\n');
};

export default AdminPanel;