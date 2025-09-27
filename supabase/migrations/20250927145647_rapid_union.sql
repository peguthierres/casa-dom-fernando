/*
  # Add campaign settings table

  1. New Tables
    - `campaign_settings`
      - `id` (uuid, primary key)
      - `goal_amount` (numeric, meta da campanha)
      - `is_active` (boolean, se a campanha está ativa)
      - `title` (text, título da campanha)
      - `description` (text, descrição da campanha)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `campaign_settings` table
    - Add policy for authenticated users to manage settings
    - Add policy for public to read active settings

  3. Initial Data
    - Insert default campaign settings
*/

CREATE TABLE IF NOT EXISTS public.campaign_settings (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    goal_amount numeric(12,2) NOT NULL DEFAULT 500000.00,
    is_active boolean DEFAULT true,
    title text DEFAULT 'Casa de Acolhimento Dom Fernando Legal',
    description text DEFAULT 'Ajude-nos a construir a Casa de Acolhimento Dom Fernando Legal para os padres idosos da Diocese de São Miguel Paulista.',
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.campaign_settings ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "campaign_settings_all_admin" ON public.campaign_settings
    FOR ALL TO authenticated
    USING (true)
    WITH CHECK (true);

CREATE POLICY "campaign_settings_select_public" ON public.campaign_settings
    FOR SELECT TO anon, authenticated
    USING (is_active = true);

-- Trigger for updated_at
CREATE TRIGGER update_campaign_settings_updated_at
    BEFORE UPDATE ON public.campaign_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Insert default settings
INSERT INTO public.campaign_settings (goal_amount, title, description)
VALUES (
    500000.00,
    'Casa de Acolhimento Dom Fernando Legal',
    'Ajude-nos a construir a Casa de Acolhimento Dom Fernando Legal para os padres idosos da Diocese de São Miguel Paulista, oferecendo-lhes o cuidado e conforto que merecem após uma vida de dedicação.'
)
ON CONFLICT DO NOTHING;

-- RPC Function to get public campaign settings
CREATE OR REPLACE FUNCTION get_campaign_settings()
RETURNS TABLE(
    goal_amount numeric,
    title text,
    description text,
    total_donated numeric,
    percentage_completed numeric
)
LANGUAGE plpgsql
AS $$
DECLARE
    settings_record RECORD;
    donated_amount numeric;
BEGIN
    -- Get active campaign settings
    SELECT cs.goal_amount, cs.title, cs.description
    INTO settings_record
    FROM public.campaign_settings cs
    WHERE cs.is_active = true
    LIMIT 1;
    
    -- Calculate total donated amount
    SELECT COALESCE(SUM(d.amount), 0)
    INTO donated_amount
    FROM public.donations d
    WHERE d.status = 'completed';
    
    -- Return results
    RETURN QUERY
    SELECT 
        settings_record.goal_amount,
        settings_record.title,
        settings_record.description,
        donated_amount,
        CASE 
            WHEN settings_record.goal_amount > 0 THEN 
                ROUND((donated_amount / settings_record.goal_amount) * 100, 1)
            ELSE 0
        END as percentage_completed;
END;
$$;