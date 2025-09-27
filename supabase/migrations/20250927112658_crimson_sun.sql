/*
  # Schema inicial para Casa de Acolhimento Dom Fernando Legal

  1. Novas Tabelas
    - `donations` - Armazena todas as doações
    - `project_images` - Galeria de imagens do projeto
    - `stripe_config` - Configurações do Stripe
    - `donor_messages` - Mensagens dos doadores

  2. Segurança
    - Habilita RLS em todas as tabelas
    - Políticas para acesso público às imagens e mensagens
    - Políticas administrativas para doações e configurações

  3. Funcionalidades
    - Triggers para timestamps automáticos
    - Índices para performance
    - Constraints para integridade dos dados
*/

-- Tabela de doações
CREATE TABLE IF NOT EXISTS donations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  donor_name text NOT NULL,
  donor_email text NOT NULL,
  donor_phone text,
  amount decimal(10,2) NOT NULL,
  currency text DEFAULT 'BRL',
  payment_method text NOT NULL CHECK (payment_method IN ('card', 'pix')),
  stripe_payment_intent_id text,
  stripe_session_id text,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'cancelled')),
  message text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Tabela de imagens do projeto
CREATE TABLE IF NOT EXISTS project_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  image_url text NOT NULL,
  display_order integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Tabela de configurações do Stripe
CREATE TABLE IF NOT EXISTS stripe_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  publishable_key text,
  secret_key text,
  webhook_secret text,
  is_test_mode boolean DEFAULT true,
  pix_enabled boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Tabela de mensagens dos doadores (para exibição pública)
CREATE TABLE IF NOT EXISTS donor_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  donor_name text NOT NULL,
  message text NOT NULL,
  is_approved boolean DEFAULT false,
  is_featured boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE donations ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE stripe_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE donor_messages ENABLE ROW LEVEL SECURITY;

-- Políticas para donations (apenas usuários autenticados podem ver)
CREATE POLICY "Admins can view all donations"
  ON donations
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow donation creation"
  ON donations
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Admins can update donations"
  ON donations
  FOR UPDATE
  TO authenticated
  USING (true);

-- Políticas para project_images (público pode ver imagens ativas)
CREATE POLICY "Anyone can view active project images"
  ON project_images
  FOR SELECT
  TO anon, authenticated
  USING (is_active = true);

CREATE POLICY "Admins can manage project images"
  ON project_images
  FOR ALL
  TO authenticated
  USING (true);

-- Políticas para stripe_config (apenas admins)
CREATE POLICY "Admins can manage stripe config"
  ON stripe_config
  FOR ALL
  TO authenticated
  USING (true);

-- Políticas para donor_messages (público pode ver aprovadas)
CREATE POLICY "Anyone can view approved messages"
  ON donor_messages
  FOR SELECT
  TO anon, authenticated
  USING (is_approved = true);

CREATE POLICY "Allow message creation"
  ON donor_messages
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Admins can manage messages"
  ON donor_messages
  FOR ALL
  TO authenticated
  USING (true);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_donations_status ON donations(status);
CREATE INDEX IF NOT EXISTS idx_donations_created_at ON donations(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_project_images_active ON project_images(is_active, display_order);
CREATE INDEX IF NOT EXISTS idx_donor_messages_approved ON donor_messages(is_approved, created_at DESC);

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para updated_at
CREATE TRIGGER update_donations_updated_at
  BEFORE UPDATE ON donations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_project_images_updated_at
  BEFORE UPDATE ON project_images
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_stripe_config_updated_at
  BEFORE UPDATE ON stripe_config
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Inserir algumas imagens de exemplo
INSERT INTO project_images (title, description, image_url, display_order) VALUES
('Terreno da Futura Casa', 'Local onde será construída a Casa de Acolhimento Dom Fernando Legal', 'https://images.pexels.com/photos/1643383/pexels-photo-1643383.jpeg?auto=compress&cs=tinysrgb&w=800', 1),
('Projeto Arquitetônico', 'Maquete do projeto arquitetônico da casa de acolhimento', 'https://images.pexels.com/photos/2098427/pexels-photo-2098427.jpeg?auto=compress&cs=tinysrgb&w=800', 2),
('Cerimônia de Bênção', 'Bênção do terreno pelo Bispo Dom Fernando Legal', 'https://images.pexels.com/photos/1643383/pexels-photo-1643383.jpeg?auto=compress&cs=tinysrgb&w=800', 3);

-- Inserir configuração inicial do Stripe (vazia)
INSERT INTO stripe_config (is_test_mode, pix_enabled) VALUES (true, false);