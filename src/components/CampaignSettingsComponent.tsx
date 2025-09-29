import React, { useState } from 'react';
import { Target, Save, DollarSign, Type, FileText, ToggleLeft, ToggleRight } from 'lucide-react';
import { supabase, CampaignSettings } from '../lib/supabase';

interface CampaignSettingsProps {
  settings: CampaignSettings | null;
  onSettingsUpdate: (settings: CampaignSettings) => void;
}

const CampaignSettingsComponent: React.FC<CampaignSettingsProps> = ({ 
  settings, 
  onSettingsUpdate 
}) => {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    goal_amount: settings?.goal_amount || 500000,
    title: settings?.title || 'Casa Presbiteral Dom Fernando Legal',
    description: settings?.description || 'Ajude-nos a construir a Casa Presbiteral Dom Fernando Legal para os padres idosos da Diocese de São Miguel Paulista.',
    is_active: settings?.is_active ?? true
  });

  React.useEffect(() => {
    if (settings) {
      setFormData({
        goal_amount: settings.goal_amount,
        title: settings.title,
        description: settings.description,
        is_active: settings.is_active
      });
    }
  }, [settings]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const dataToSave = {
        ...formData,
        updated_at: new Date().toISOString()
      };

      if (settings) {
        // Update existing settings
        const { data, error } = await supabase
          .from('campaign_settings')
          .update(dataToSave)
          .eq('id', settings.id)
          .select()
          .single();

        if (error) throw error;
        
        if (data) {
          onSettingsUpdate(data);
        }
      } else {
        // Create new settings
        const { data, error } = await supabase
          .from('campaign_settings')
          .insert([dataToSave])
          .select()
          .single();

        if (error) throw error;
        
        if (data) {
          onSettingsUpdate(data);
        }
      }

      alert('Configurações da campanha salvas com sucesso!');
    } catch (error) {
      console.error('Error saving campaign settings:', error);
      alert('Erro ao salvar configurações da campanha. Tente novamente.');
    } finally {
      setSaving(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const handleGoalAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value) || 0;
    setFormData({ ...formData, goal_amount: value });
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center gap-3 mb-6">
          <Target className="h-6 w-6 text-blue-600" />
          <h2 className="text-xl font-semibold text-gray-800">
            Configurações da Meta da Campanha
          </h2>
        </div>

        <div className="space-y-6">
          {/* Campaign Status */}
          <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-gray-800">Status da Campanha</h3>
                <p className="text-sm text-gray-600">
                  {formData.is_active ? 'A campanha está ativa e visível para doadores' : 'A campanha está pausada'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setFormData({...formData, is_active: !formData.is_active})}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                  formData.is_active
                    ? 'bg-green-100 text-green-700 hover:bg-green-200'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {formData.is_active ? (
                  <>
                    <ToggleRight className="h-5 w-5" />
                    Ativa
                  </>
                ) : (
                  <>
                    <ToggleLeft className="h-5 w-5" />
                    Pausada
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Goal Amount */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Meta da Campanha (R$)
            </label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
              <input
                type="number"
                min="0"
                step="0.01"
                value={formData.goal_amount}
                onChange={handleGoalAmountChange}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="500000.00"
              />
            </div>
            <p className="text-sm text-gray-500 mt-1">
              Valor formatado: {formatCurrency(formData.goal_amount)}
            </p>
          </div>

          {/* Campaign Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Título da Campanha
            </label>
            <div className="relative">
              <Type className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({...formData, title: e.target.value})}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Casa de Acolhimento Dom Fernando Legal"
              />
            </div>
            <p className="text-sm text-gray-500 mt-1">
              Este título aparecerá na página inicial
            </p>
          </div>

          {/* Campaign Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Descrição da Campanha
            </label>
            <div className="relative">
              <FileText className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
              <textarea
                rows={4}
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                placeholder="Ajude-nos a construir a Casa Presbiteral Dom Fernando Legal..."
              />
            </div>
            <p className="text-sm text-gray-500 mt-1">
              Esta descrição aparecerá na seção hero da página inicial
            </p>
          </div>

          {/* Preview */}
          <div className="border-t pt-6">
            <h3 className="font-medium text-gray-800 mb-4">Prévia da Campanha</h3>
            <div className="bg-blue-50 rounded-lg p-6 border border-blue-200">
              <div className="text-center">
                <h4 className="text-2xl font-bold text-blue-800 mb-2">
                  {formData.title}
                </h4>
                <p className="text-blue-700 mb-4">
                  {formData.description}
                </p>
                <div className="bg-white rounded-lg p-4 inline-block">
                  <div className="text-sm text-gray-600 mb-1">Meta da Campanha</div>
                  <div className="text-2xl font-bold text-blue-600">
                    {formatCurrency(formData.goal_amount)}
                  </div>
                </div>
                {!formData.is_active && (
                  <div className="mt-4 bg-yellow-100 border border-yellow-300 rounded-lg p-3">
                    <p className="text-yellow-800 text-sm font-medium">
                      ⚠️ Campanha pausada - não visível para doadores
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Save Button */}
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
                <>
                  <Save className="h-5 w-5" />
                  Salvar Configurações
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Instructions */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="font-medium text-blue-800 mb-3">Como usar as configurações da campanha:</h3>
        <ul className="list-disc list-inside space-y-2 text-sm text-blue-700">
          <li><strong>Meta da Campanha:</strong> Define o valor total que você deseja arrecadar</li>
          <li><strong>Título:</strong> Aparece como título principal na página inicial</li>
          <li><strong>Descrição:</strong> Texto explicativo que aparece abaixo do título</li>
          <li><strong>Status:</strong> Controla se a campanha está visível para doadores</li>
          <li><strong>Porcentagem:</strong> É calculada automaticamente com base nas doações recebidas</li>
        </ul>
        
        <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded">
          <p className="text-xs text-green-800">
            <strong>Dica:</strong> As alterações são aplicadas imediatamente na página inicial. 
            A porcentagem de progresso é atualizada automaticamente conforme novas doações são recebidas.
          </p>
        </div>
      </div>
    </div>
  );
};

export default CampaignSettingsComponent;