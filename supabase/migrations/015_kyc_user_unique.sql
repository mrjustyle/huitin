-- Add unique constraint on user_id for kyc_documents to support upsert
ALTER TABLE public.kyc_documents ADD CONSTRAINT kyc_documents_user_id_unique UNIQUE (user_id);
