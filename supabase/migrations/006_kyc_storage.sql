-- Migration 006: Create KYC Documents Storage Bucket

-- Insert the bucket (idempotent if using DO ON CONFLICT, but we'll use a safe function)
INSERT INTO storage.buckets (id, name, public)
VALUES ('kyc-documents', 'kyc-documents', false)
ON CONFLICT (id) DO NOTHING;

-- RLS for kyc-documents bucket

-- 1. Users can upload KYC documents to their own folder (auth.uid())
CREATE POLICY "users_upload_kyc_bucket" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'kyc-documents' 
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- 2. Users can read their own KYC documents
CREATE POLICY "users_read_own_kyc_bucket" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'kyc-documents' 
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- 3. Users can update their own KYC documents (if they need to re-upload)
CREATE POLICY "users_update_own_kyc_bucket" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'kyc-documents' 
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- 4. Admins can read all KYC documents
CREATE POLICY "admin_read_kyc_bucket" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'kyc-documents'
    AND (SELECT role FROM public.user_profiles WHERE id = auth.uid()) IN ('admin', 'support')
  );
