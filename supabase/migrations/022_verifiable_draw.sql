-- Create table for hidden server seeds
CREATE TABLE public.period_draw_secrets (
  period_id UUID PRIMARY KEY REFERENCES public.hui_periods(id) ON DELETE CASCADE,
  server_seed TEXT NOT NULL
);

-- RLS: Only admins or service roles can access this
ALTER TABLE public.period_draw_secrets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_all_secrets" ON public.period_draw_secrets
  FOR ALL USING (public.is_admin());

-- Add columns to hui_periods for provably fair draw
ALTER TABLE public.hui_periods 
ADD COLUMN draw_server_hash TEXT,
ADD COLUMN draw_server_seed TEXT,
ADD COLUMN draw_client_seed TEXT;
