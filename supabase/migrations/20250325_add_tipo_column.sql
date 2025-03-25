-- Adiciona o campo tipo na tabela usuarios
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS tipo text CHECK (tipo IN ('barbeiro', 'cliente')) NOT NULL DEFAULT 'cliente';

-- Define o barbeiro padrão
UPDATE usuarios 
SET tipo = 'barbeiro' 
WHERE email = 'barber@gansinho.com';
