-- Create the recurring_agendamentos table
CREATE TABLE IF NOT EXISTS recurring_agendamentos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  telefone TEXT NOT NULL,
  servico TEXT NOT NULL,
  dia_semana INTEGER NOT NULL, -- 0 = Domingo, 1 = Segunda, ..., 6 = Sábado
  horario TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'ativo',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Enable Row Level Security
ALTER TABLE recurring_agendamentos ENABLE ROW LEVEL SECURITY;

-- Create policy to allow public access
CREATE POLICY "Allow public access" ON recurring_agendamentos
FOR ALL
TO PUBLIC
USING (true)
WITH CHECK (true);