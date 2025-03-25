// Script para listar todos os agendamentos no banco de dados
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

// Configurações do Supabase
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

console.log('URL do Supabase:', supabaseUrl);
console.log('Chave do Supabase está definida:', !!supabaseAnonKey);

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Credenciais do Supabase não configuradas');
  process.exit(1);
}

// Criar cliente Supabase com as mesmas configurações da aplicação principal
const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false
  },
  db: {
    schema: 'public'
  }
});

async function listarTodosAgendamentos() {
  try {
    // Consultar todos os agendamentos normais
    console.log('\n=== AGENDAMENTOS NORMAIS ===');
    const { data: agendamentosNormais, error: errorNormal } = await supabase
      .from('agendamentos')
      .select('*')
      .order('data', { ascending: true });

    if (errorNormal) throw errorNormal;

    if (agendamentosNormais.length === 0) {
      console.log('Nenhum agendamento normal encontrado.');
    } else {
      console.log(`Total de agendamentos normais: ${agendamentosNormais.length}`);
      agendamentosNormais.forEach((a, index) => {
        console.log(`\n[${index + 1}] Agendamento ID: ${a.id}`);
        console.log(`- Cliente: ${a.nome}`);
        console.log(`- Data: ${a.data}`);
        console.log(`- Horário: ${a.horario}`);
        console.log(`- Serviço: ${a.servico}`);
        console.log(`- Status: ${a.status}`);
        console.log(`- Telefone: ${a.telefone}`);
        console.log(`- Criado em: ${a.created_at}`);
      });
    }

    // Consultar todos os agendamentos recorrentes
    console.log('\n=== AGENDAMENTOS RECORRENTES ===');
    const { data: agendamentosRecorrentes, error: errorRecorrente } = await supabase
      .from('recurring_agendamentos')
      .select('*')
      .order('created_at', { ascending: false });

    if (errorRecorrente) throw errorRecorrente;

    if (agendamentosRecorrentes.length === 0) {
      console.log('Nenhum agendamento recorrente encontrado.');
    } else {
      console.log(`Total de agendamentos recorrentes: ${agendamentosRecorrentes.length}`);
      agendamentosRecorrentes.forEach((a, index) => {
        console.log(`\n[${index + 1}] Agendamento Recorrente ID: ${a.id}`);
        console.log(`- Cliente: ${a.nome}`);
        console.log(`- Dia da semana: ${a.dia_semana} (${getDiaSemanaTexto(a.dia_semana)})`);
        console.log(`- Horário: ${a.horario}`);
        console.log(`- Serviço: ${a.servico}`);
        console.log(`- Status: ${a.status}`);
        console.log(`- Telefone: ${a.telefone}`);
        console.log(`- Criado em: ${a.created_at}`);
      });
    }
  } catch (error) {
    console.error('Erro ao listar agendamentos:', error);
  }
}

// Função auxiliar para converter número do dia da semana em texto
function getDiaSemanaTexto(diaSemana) {
  const diasSemana = [
    'Domingo',
    'Segunda-feira',
    'Terça-feira',
    'Quarta-feira',
    'Quinta-feira',
    'Sexta-feira',
    'Sábado'
  ];
  return diasSemana[diaSemana] || 'Desconhecido';
}

listarTodosAgendamentos();