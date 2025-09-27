/*
  # Allow public access to Stripe configuration for donations

  1. New Functions
    - `get_public_stripe_config()` - Returns only publishable_key and pix_enabled for public use
  
  2. Security
    - Function is accessible to anonymous users
    - Only returns safe, public information (publishable key)
    - Secret keys remain protected
*/

-- Create function to get public Stripe configuration
CREATE OR REPLACE FUNCTION get_public_stripe_config()
RETURNS TABLE (
  publishable_key text,
  pix_enabled boolean,
  is_test_mode boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    sc.publishable_key,
    sc.pix_enabled,
    sc.is_test_mode
  FROM stripe_config sc
  WHERE sc.publishable_key IS NOT NULL
  LIMIT 1;
END;
$$;

-- Grant execute permission to anonymous users
GRANT EXECUTE ON FUNCTION get_public_stripe_config() TO anon;
GRANT EXECUTE ON FUNCTION get_public_stripe_config() TO authenticated;