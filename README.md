# Casa de Acolhimento Dom Fernando Legal

Sistema de doações para a construção da Casa de Acolhimento Dom Fernando Legal da Diocese de São Miguel Paulista.

## 🚀 Configuração do Projeto

### 1. Configurar Supabase

1. Clique no botão "Supabase" nas configurações do projeto
2. Crie um novo projeto ou conecte um existente
3. As migrações do banco de dados serão aplicadas automaticamente

### 2. Configurar Stripe

#### 2.1 Criar conta no Stripe
1. Acesse [https://dashboard.stripe.com/register](https://dashboard.stripe.com/register)
2. Crie sua conta e complete a verificação

#### 2.2 Obter chaves da API
1. No Dashboard do Stripe, vá em **Developers** → **API keys**
2. Copie a **Publishable key** (pk_test_... ou pk_live_...)
3. Copie a **Secret key** (sk_test_... ou sk_live_...)

#### 2.3 Configurar Webhooks
1. No Dashboard do Stripe, vá em **Developers** → **Webhooks**
2. Clique em **Add endpoint**
3. URL do endpoint: `https://SEU_PROJETO.supabase.co/functions/v1/stripe-webhook`
4. Selecione os eventos:
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
5. Copie o **Signing secret** (whsec_...)

#### 2.4 Habilitar PIX (Brasil)
1. No Dashboard do Stripe, vá em **Settings** → **Payment methods**
2. Ative **PIX** para o Brasil
3. Complete a configuração seguindo as instruções do Stripe

### 3. Configurar no Painel Administrativo

1. Acesse `/login` e faça login com suas credenciais do Supabase
2. Vá para **Configurações** no painel administrativo
3. Insira as chaves do Stripe:
   - **Publishable Key**: pk_test_... ou pk_live_...
   - **Secret Key**: sk_test_... ou sk_live_...
   - **Webhook Secret**: whsec_...
4. Ative o **Modo de Teste** se estiver usando chaves de teste
5. Ative **PIX** se configurado no Stripe
6. Clique em **Testar Conexão** para verificar
7. Salve as configurações

### 4. Criar Usuário Administrador

No Supabase Dashboard:
1. Vá em **Authentication** → **Users**
2. Clique em **Add user**
3. Insira email e senha para o administrador
4. Confirme o email se necessário

## 🏗️ Estrutura do Banco de Dados

### Tabelas Criadas:
- **donations**: Armazena todas as doações
- **project_images**: Galeria de imagens do projeto
- **stripe_config**: Configurações do Stripe
- **donor_messages**: Mensagens dos doadores

### Edge Functions:
- **create-payment-intent**: Processa pagamentos com cartão
- **create-pix-payment**: Processa pagamentos PIX
- **stripe-webhook**: Recebe notificações do Stripe

## 🔐 Segurança

- **RLS (Row Level Security)** habilitado em todas as tabelas
- **Políticas de acesso** configuradas adequadamente
- **Autenticação** obrigatória para área administrativa
- **Webhooks** com verificação de assinatura

## 💳 Métodos de Pagamento

### Cartão de Crédito
- Processamento via Stripe
- Suporte a todos os cartões principais
- Pagamento instantâneo

### PIX
- Integração via Stripe PIX
- QR Code gerado automaticamente
- Confirmação em tempo real

## 🎛️ Funcionalidades do Painel

- **Dashboard** com estatísticas em tempo real
- **Gestão de doações** com filtros e status
- **Galeria de imagens** com upload/exclusão
- **Configurações do Stripe** com teste de conexão
- **Mensagens dos doadores** para moderação

## 🔧 Desenvolvimento

### Comandos disponíveis:
```bash
npm run dev          # Servidor de desenvolvimento
npm run build        # Build para produção
npm run preview      # Preview da build
```

### Variáveis de ambiente necessárias:

**CRÍTICO**: Para que o sistema funcione, você DEVE configurar estas variáveis:

#### Desenvolvimento Local:
1. Copie `.env.example` para `.env.local`
2. Preencha com seus valores do Supabase:
   - `VITE_SUPABASE_URL`: URL do seu projeto Supabase
   - `VITE_SUPABASE_ANON_KEY`: Chave anônima do Supabase

#### Produção (Netlify):
1. Acesse seu site no Netlify Dashboard
2. Vá em **Site settings** → **Environment variables**
3. Adicione as variáveis:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
4. Faça um novo deploy

#### Como obter os valores:
1. Acesse [Supabase Dashboard](https://app.supabase.com)
2. Selecione seu projeto
3. Vá em **Settings** → **API**
4. Copie:
   - **Project URL** → `VITE_SUPABASE_URL`
   - **anon/public key** → `VITE_SUPABASE_ANON_KEY`

## 📱 Responsividade

- Design totalmente responsivo
- Otimizado para mobile
- Navegação intuitiva em todos os dispositivos

## 🚀 Deploy

O projeto está configurado para deploy automático. As Edge Functions do Supabase são deployadas automaticamente quando você configura o Supabase.

## 📞 Suporte

Para dúvidas sobre configuração:
1. Verifique se todas as chaves estão corretas
2. Teste a conexão no painel administrativo
3. Verifique os logs das Edge Functions no Supabase
4. Confirme se os webhooks estão configurados corretamente

## 🎯 Próximos Passos

1. Configure o Supabase
2. Configure o Stripe
3. Crie um usuário administrador
4. Teste uma doação
5. Publique o projeto