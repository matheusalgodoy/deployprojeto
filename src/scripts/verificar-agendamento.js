// Script para verificar agendamentos para uma data e horário específicos
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

// Data e horário a verificar
const dataVerificar = '2025-03-26';
const horarioVerificar = '09:00';

// Adicionar logs para depuração
console.log('Verificando disponibilidade para:', { data: dataVerificar, horario: horarioVerificar });

// Formatos alternativos da data para testar
const dataObj = new Date(dataVerificar);
const dataFormatada = dataVerificar.split('T')[0]; // Caso a data venha com timestamp

async function verificarAgendamento() {
  try {
    // Consultar agendamentos normais
    const { data: agendamentosNormais, error: errorNormal } = await supabase
      .from('agendamentos')
      .select('*')
      .eq('data', dataVerificar)
      .eq('horario', horarioVerificar)
      .not('status', 'eq', 'cancelado');

    if (errorNormal) throw errorNormal;
    
    console.log(`Agendamentos normais encontrados: ${agendamentosNormais.length}`);
    console.log('Detalhes da consulta de agendamentos normais:', {
      tabela: 'agendamentos',
      data: dataVerificar,
      horario: horarioVerificar,
      resultados: agendamentosNormais
    });

    // Verificar dia da semana para consultar agendamentos recorrentes
    const data = new Date(dataVerificar);
    const diaSemana = data.getDay(); // 0 = domingo, 1 = segunda, ..., 6 = sábado
    console.log(`Dia da semana para ${dataVerificar}: ${diaSemana}`);

    // Consultar agendamentos recorrentes
    const { data: agendamentosRecorrentes, error: errorRecorrente } = await supabase
      .from('recurring_agendamentos')
      .select('*')
      .eq('dia_semana', diaSemana)
      .eq('horario', horarioVerificar)
      .eq('status', 'ativo');

    if (errorRecorrente) throw errorRecorrente;
    
    console.log(`Agendamentos recorrentes encontrados: ${agendamentosRecorrentes.length}`);
    console.log('Detalhes da consulta de agendamentos recorrentes:', {
      tabela: 'recurring_agendamentos',
      dia_semana: diaSemana,
      horario: horarioVerificar,
      resultados: agendamentosRecorrentes
    });

    // Exibir resultados
    console.log(`\nVerificando agendamentos para ${dataVerificar} às ${horarioVerificar}:\n`);

    if (agendamentosNormais.length === 0 && agendamentosRecorrentes.length === 0) {
      console.log('✅ Horário disponível! Não há agendamentos para esta data e horário.');
    } else {
      console.log('❌ Horário indisponível! Agendamentos encontrados:');
      
      // Exibir agendamentos normais
      if (agendamentosNormais.length > 0) {
        console.log('\nAgendamentos normais:');
        agendamentosNormais.forEach(a => {
          console.log(`- Cliente: ${a.nome}`);
          console.log(`  Serviço: ${a.servico}`);
          console.log(`  Status: ${a.status}`);
          console.log(`  Telefone: ${a.telefone}`);
        });
      }

      // Exibir agendamentos recorrentes
      if (agendamentosRecorrentes.length > 0) {
        console.log('\nAgendamentos recorrentes:');
        agendamentosRecorrentes.forEach(a => {
          console.log(`- Cliente: ${a.nome}`);
          console.log(`  Serviço: ${a.servico}`);
          console.log(`  Status: ${a.status}`);
          console.log(`  Telefone: ${a.telefone}`);
        });
      }
    }
  } catch (error) {
    console.error('Erro ao verificar agendamentos:', error);
  }
}

verificarAgendamento();