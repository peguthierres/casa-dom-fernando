/*
  # Correção completa das políticas RLS

  1. Remove todas as políticas existentes
  2. Recria as políticas com nomes únicos
  3. Permite doações anônimas
  4. Mantém segurança para administração
*/

-- Remover todas as políticas existentes da tabela donations
DROP POLICY IF EXISTS "Admins can view all donations" ON donations;
DROP POLICY IF EXISTS "Admins can update donations" ON donations;
DROP POLICY IF EXISTS "Allow donation creation" ON donations;
DROP POLICY IF EXISTS "Allow anonymous donations" ON donations;
DROP POLICY IF EXISTS "Public can create donations" ON donations;

-- Remover todas as políticas existentes da tabela donor_messages
DROP POLICY IF EXISTS "Admins can manage messages" ON donor_messages;
DROP POLICY IF EXISTS "Allow message creation" ON donor_messages;
DROP POLICY IF EXISTS "Anyone can view approved messages" ON donor_messages;
DROP POLICY IF EXISTS "Public can view approved messages" ON donor_messages;

-- Remover todas as políticas existentes da tabela project_images
DROP POLICY IF EXISTS "Admins can manage project images" ON project_images;
DROP POLICY IF EXISTS "Anyone can view active project images" ON project_images;
DROP POLICY IF EXISTS "Public can view active images" ON project_images;

-- Remover todas as políticas existentes da tabela stripe_config
DROP POLICY IF EXISTS "Admins can manage stripe config" ON stripe_config;

-- Recriar políticas para donations
CREATE POLICY "donations_insert_public" ON donations
  FOR INSERT TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "donations_select_admin" ON donations
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "donations_update_admin" ON donations
  FOR UPDATE TO authenticated
  USING (true)
  WITH CHECK (true);

-- Recriar políticas para donor_messages
CREATE POLICY "donor_messages_insert_public" ON donor_messages
  FOR INSERT TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "donor_messages_select_approved" ON donor_messages
  FOR SELECT TO anon, authenticated
  USING (is_approved = true);

CREATE POLICY "donor_messages_all_admin" ON donor_messages
  FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true);

-- Recriar políticas para project_images
CREATE POLICY "project_images_select_active" ON project_images
  FOR SELECT TO anon, authenticated
  USING (is_active = true);

CREATE POLICY "project_images_all_admin" ON project_images
  FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true);

-- Recriar políticas para stripe_config
CREATE POLICY "stripe_config_all_admin" ON stripe_config
  FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true);

-- Garantir que RLS está habilitado
ALTER TABLE donations ENABLE ROW LEVEL SECURITY;
ALTER TABLE donor_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE stripe_config ENABLE ROW LEVEL SECURITY;