import React from 'react';
import { X, Download, User, Mail, Phone, Calendar, CreditCard, MessageSquare, FileText, CheckCircle, Clock, XCircle } from 'lucide-react';
import { Donation } from '../lib/supabase';

interface TransactionModalProps {
  donation: Donation | null;
  isOpen: boolean;
  onClose: () => void;
}

const TransactionModal: React.FC<TransactionModalProps> = ({ donation, isOpen, onClose }) => {
  if (!isOpen || !donation) return null;

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'pending':
        return <Clock className="h-5 w-5 text-yellow-600" />;
      case 'failed':
        return <XCircle className="h-5 w-5 text-red-600" />;
      default:
        return <Clock className="h-5 w-5 text-gray-600" />;
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
      case 'cancelled':
        return 'Cancelada';
      default:
        return 'Desconhecido';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'failed':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'cancelled':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const downloadReceipt = () => {
    const receiptContent = generateReceiptContent(donation);
    const blob = new Blob([receiptContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `comprovante-doacao-${donation.id.slice(0, 8)}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const downloadReceiptPDF = () => {
    const receiptHTML = generateReceiptHTML(donation);
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(receiptHTML);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
        printWindow.close();
      }, 250);
    }
  };

  const copyTransactionId = () => {
    navigator.clipboard.writeText(donation.id);
    alert('ID da transação copiado para a área de transferência!');
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <FileText className="h-6 w-6 text-blue-600" />
            <h2 className="text-xl font-bold text-gray-800">Detalhes da Transação</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Status */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {getStatusIcon(donation.status)}
              <span className="font-medium text-gray-800">Status da Doação</span>
            </div>
            <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(donation.status)}`}>
              {getStatusText(donation.status)}
            </span>
          </div>

          {/* Transaction ID */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-700 mb-1">ID da Transação</p>
                <p className="text-xs text-gray-500 font-mono">{donation.id}</p>
              </div>
              <button
                onClick={copyTransactionId}
                className="text-blue-600 hover:text-blue-700 text-sm font-medium"
              >
                Copiar ID
              </button>
            </div>
          </div>

          {/* Amount */}
          <div className="text-center bg-blue-50 rounded-lg p-6">
            <p className="text-sm text-blue-600 mb-2">Valor da Doação</p>
            <p className="text-3xl font-bold text-blue-800">
              R$ {donation.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
            <p className="text-sm text-blue-600 mt-1">
              {donation.currency} • {donation.payment_method === 'card' ? 'Cartão de Crédito' : 'PIX'}
            </p>
          </div>

          {/* Donor Information */}
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-800 flex items-center gap-2">
              <User className="h-5 w-5" />
              Informações do Doador
            </h3>
            
            <div className="grid md:grid-cols-2 gap-4">
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <User className="h-4 w-4 text-gray-500" />
                <div>
                  <p className="text-xs text-gray-500">Nome</p>
                  <p className="font-medium text-gray-800">{donation.donor_name}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <Mail className="h-4 w-4 text-gray-500" />
                <div>
                  <p className="text-xs text-gray-500">E-mail</p>
                  <p className="font-medium text-gray-800">{donation.donor_email}</p>
                </div>
              </div>
              
              {donation.donor_phone && (
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg md:col-span-2">
                  <Phone className="h-4 w-4 text-gray-500" />
                  <div>
                    <p className="text-xs text-gray-500">Telefone</p>
                    <p className="font-medium text-gray-800">{donation.donor_phone}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Payment Information */}
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-800 flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Informações do Pagamento
            </h3>
            
            <div className="grid md:grid-cols-2 gap-4">
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <Calendar className="h-4 w-4 text-gray-500" />
                <div>
                  <p className="text-xs text-gray-500">Data da Doação</p>
                  <p className="font-medium text-gray-800">
                    {new Date(donation.created_at).toLocaleDateString('pt-BR', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <CreditCard className="h-4 w-4 text-gray-500" />
                <div>
                  <p className="text-xs text-gray-500">Método de Pagamento</p>
                  <p className="font-medium text-gray-800">
                    {donation.payment_method === 'card' ? 'Cartão de Crédito' : 'PIX'}
                  </p>
                </div>
              </div>
              
              {donation.stripe_payment_intent_id && (
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg md:col-span-2">
                  <FileText className="h-4 w-4 text-gray-500" />
                  <div>
                    <p className="text-xs text-gray-500">ID do Stripe</p>
                    <p className="font-medium text-gray-800 font-mono text-sm">
                      {donation.stripe_payment_intent_id}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Message */}
          {donation.message && (
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Mensagem do Doador
              </h3>
              <div className="bg-blue-50 border-l-4 border-blue-600 p-4 rounded-r-lg">
                <p className="text-gray-700 italic">"{donation.message}"</p>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t border-gray-200">
            <button
              onClick={downloadReceiptPDF}
              className="flex-1 bg-blue-600 text-white px-4 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
            >
              <Download className="h-4 w-4" />
              Baixar Comprovante (PDF)
            </button>
            
            <button
              onClick={downloadReceipt}
              className="flex-1 bg-gray-600 text-white px-4 py-3 rounded-lg font-medium hover:bg-gray-700 transition-colors flex items-center justify-center gap-2"
            >
              <Download className="h-4 w-4" />
              Baixar Comprovante (TXT)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const generateReceiptContent = (donation: Donation): string => {
  return `
COMPROVANTE DE DOAÇÃO
Casa de Acolhimento Dom Fernando Legal
Diocese de São Miguel Paulista

========================================

ID da Transação: ${donation.id}
Data: ${new Date(donation.created_at).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })}

DOADOR:
Nome: ${donation.donor_name}
E-mail: ${donation.donor_email}
${donation.donor_phone ? `Telefone: ${donation.donor_phone}` : ''}

DOAÇÃO:
Valor: R$ ${donation.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
Moeda: ${donation.currency}
Método: ${donation.payment_method === 'card' ? 'Cartão de Crédito' : 'PIX'}
Status: ${donation.status === 'completed' ? 'Concluída' : donation.status === 'pending' ? 'Pendente' : 'Falhou'}

${donation.message ? `MENSAGEM:\n"${donation.message}"` : ''}

${donation.stripe_payment_intent_id ? `ID Stripe: ${donation.stripe_payment_intent_id}` : ''}

========================================

Obrigado por sua contribuição!
Sua doação ajuda a construir um lar digno
para os sacerdotes da Diocese de São Miguel Paulista.

Contato: (11) 2031-2100
E-mail: contato@diocesesaomiguel.org.br

Este é um comprovante válido de doação.
Gerado em: ${new Date().toLocaleString('pt-BR')}
`;
};

const generateReceiptHTML = (donation: Donation): string => {
  return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Comprovante de Doação</title>
    <style>
        body { font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { text-align: center; border-bottom: 2px solid #2563eb; padding-bottom: 20px; margin-bottom: 30px; }
        .header h1 { color: #2563eb; margin: 0; }
        .header h2 { color: #666; margin: 5px 0; font-weight: normal; }
        .section { margin: 20px 0; }
        .section h3 { color: #2563eb; border-bottom: 1px solid #e5e7eb; padding-bottom: 5px; }
        .info-grid { display: grid; grid-template-columns: 1fr 2fr; gap: 10px; margin: 10px 0; }
        .info-label { font-weight: bold; color: #374151; }
        .info-value { color: #111827; }
        .amount { text-align: center; background: #eff6ff; padding: 20px; border-radius: 8px; margin: 20px 0; }
        .amount .value { font-size: 2em; font-weight: bold; color: #2563eb; }
        .message { background: #f3f4f6; padding: 15px; border-left: 4px solid #2563eb; margin: 15px 0; font-style: italic; }
        .footer { text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #666; font-size: 0.9em; }
        @media print { body { margin: 0; } }
    </style>
</head>
<body>
    <div class="header">
        <h1>COMPROVANTE DE DOAÇÃO</h1>
        <h2>Casa Presbiteral Dom Fernando Legal</h2>
        <h2>Diocese de São Miguel Paulista</h2>
    </div>

    <div class="section">
        <h3>Informações da Transação</h3>
        <div class="info-grid">
            <span class="info-label">ID da Transação:</span>
            <span class="info-value">${donation.id}</span>
            <span class="info-label">Data:</span>
            <span class="info-value">${new Date(donation.created_at).toLocaleDateString('pt-BR', {
              day: '2-digit',
              month: '2-digit', 
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}</span>
            <span class="info-label">Status:</span>
            <span class="info-value">${donation.status === 'completed' ? 'Concluída' : donation.status === 'pending' ? 'Pendente' : 'Falhou'}</span>
        </div>
    </div>

    <div class="amount">
        <div>Valor da Doação</div>
        <div class="value">R$ ${donation.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
        <div>${donation.currency} • ${donation.payment_method === 'card' ? 'Cartão de Crédito' : 'PIX'}</div>
    </div>

    <div class="section">
        <h3>Dados do Doador</h3>
        <div class="info-grid">
            <span class="info-label">Nome:</span>
            <span class="info-value">${donation.donor_name}</span>
            <span class="info-label">E-mail:</span>
            <span class="info-value">${donation.donor_email}</span>
            ${donation.donor_phone ? `
            <span class="info-label">Telefone:</span>
            <span class="info-value">${donation.donor_phone}</span>
            ` : ''}
        </div>
    </div>

    ${donation.message ? `
    <div class="section">
        <h3>Mensagem do Doador</h3>
        <div class="message">"${donation.message}"</div>
    </div>
    ` : ''}

    ${donation.stripe_payment_intent_id ? `
    <div class="section">
        <h3>Informações Técnicas</h3>
        <div class="info-grid">
            <span class="info-label">ID Stripe:</span>
            <span class="info-value">${donation.stripe_payment_intent_id}</span>
        </div>
    </div>
    ` : ''}

    <div class="footer">
        <p><strong>Obrigado por sua contribuição!</strong></p>
        <p>Sua doação ajuda a construir um lar digno para os sacerdotes da Diocese de São Miguel Paulista.</p>
        <p>Contato: (11) 2031-2100 | E-mail: contato@diocesesaomiguel.org.br</p>
        <p>Este é um comprovante válido de doação.</p>
        <p>Gerado em: ${new Date().toLocaleString('pt-BR')}</p>
    </div>
</body>
</html>
`;
};

export default TransactionModal;