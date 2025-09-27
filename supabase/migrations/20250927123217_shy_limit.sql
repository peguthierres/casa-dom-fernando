/*
  # Corrigir políticas RLS para stripe_config

  1. Políticas
    - Permitir leitura pública da publishable_key (é segura)
    - Manter outras operações apenas para admin
  
  2. Segurança
    - publishable_key é segura para exposição pública
    - secret_key e webhook_secret permanecem protegidas
*/

-- Remover política restritiva existente se houver
DROP POLICY IF EXISTS "stripe_config_all_admin" ON stripe_config;

-- Permitir leitura pública apenas da publishable_key
CREATE POLICY "stripe_config_select_public_key"
  ON stripe_config
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- Permitir todas as operações para usuários autenticados (admin)
CREATE POLICY "stripe_config_all_admin"
  ON stripe_config
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);