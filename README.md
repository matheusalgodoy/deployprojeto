# Barbearia do Gansinho

Sistema de agendamento online para barbearia.

## Configuração do Ambiente

1. Clone o repositório
```bash
git clone <seu-repositorio>
cd eee-main
```

2. Instale as dependências
```bash
npm install
```

3. Configure as variáveis de ambiente
- Copie o arquivo `.env.example` para `.env`
- Preencha as variáveis com suas credenciais do Supabase

4. Execute o projeto localmente
```bash
npm run dev
```

## Deploy com Vercel

1. Preparação:
   - Instale o Git: https://git-scm.com/downloads
   - Crie uma conta no GitHub: https://github.com/signup
   - Crie uma conta no Vercel: https://vercel.com/signup

2. Inicialize o Git e faça commit:
```bash
git init
git add .
git commit -m "Initial commit"
```

3. No GitHub:
   - Crie um novo repositório
   - Siga as instruções para push do código

4. No Vercel:
   - Clique em "New Project"
   - Importe o repositório do GitHub
   - Configure as variáveis de ambiente:
     - VITE_SUPABASE_URL
     - VITE_SUPABASE_KEY
     - VITE_BARBEARIA_TELEFONE
   - Clique em "Deploy"

## Alternativas de Deploy

### Netlify
- Crie uma conta em https://netlify.com
- Conecte com GitHub ou faça upload manual
- Configure as mesmas variáveis de ambiente

### Railway
- Bom para projetos com backend
- https://railway.app
- Suporta Docker e banco de dados

## Desenvolvimento

Para desenvolvimento local após o setup inicial:
```bash
npm run dev
```

O projeto estará disponível em `http://localhost:5173`

Quais tecnologias são usadas neste projeto?
Este projeto é construído com:

Vite
TypeScript
React
shadcn-ui
Tailwind CSS