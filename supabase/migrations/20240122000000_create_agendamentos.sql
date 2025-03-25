-- Create the agendamentos table
CREATE TABLE IF NOT EXISTS agendamentos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  telefone TEXT NOT NULL,
  servico TEXT NOT NULL,
  data TEXT NOT NULL,
  horario TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'confirmado',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Enable Row Level Security
ALTER TABLE agendamentos ENABLE ROW LEVEL SECURITY;

-- Create policy to allow public access
CREATE POLICY "Allow public access" ON agendamentos
FOR ALL
TO PUBLIC
USING (true)
WITH CHECK (true);