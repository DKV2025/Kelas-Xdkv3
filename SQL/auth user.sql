CREATE TABLE public.activity_logs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  action text NOT NULL,
  target_type text,
  target_id text,
  metadata jsonb,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Semua bisa baca log" 
ON public.activity_logs FOR SELECT USING (true);

CREATE POLICY "Hanya user login yang bisa insert log" 
ON public.activity_logs FOR INSERT WITH CHECK (auth.role() = 'authenticated');