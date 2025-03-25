-- Adicionar coluna email à tabela de agendamentos
ALTER TABLE agendamentos ADD COLUMN IF NOT EXISTS email TEXT;
