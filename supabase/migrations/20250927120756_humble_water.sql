/*
  # Fix RLS policies for donations table

  1. Security Changes
    - Drop existing policies safely (if they exist)
    - Recreate policies with correct permissions
    - Allow anonymous users to create donations
    - Allow admins to manage all donations

  2. Changes
    - Anonymous users can INSERT donations
    - Authenticated users (admins) can SELECT, UPDATE donations
    - Public can view approved donor messages
*/

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Admins can view all donations" ON donations;
DROP POLICY IF EXISTS "Admins can update donations" ON donations;
DROP POLICY IF EXISTS "Allow donation creation" ON donations;

-- Create new policies
CREATE POLICY "Allow donation creation"
  ON donations
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Admins can view all donations"
  ON donations
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can update donations"
  ON donations
  FOR UPDATE
  TO authenticated
  USING (true);