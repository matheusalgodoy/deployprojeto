// Script para verificar disponibilidade usando a mesma lógica da interface
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

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

// Horários iniciais disponíveis (mesmos da interface)
const initialHorariosDisponiveis = [
  "09:00", "09:30", "10:00", "10:30", "11:00", "11:30", 
  "14:00", "14:30", "15:00", "15:30", "16:00", "16:30", "17:00"
];

// Função para verificar disponibilidade usando a mesma lógica da interface
async function verificarDisponibilidadeInterface() {
  try {
    console.log(`\nVerificando disponibilidade para ${dataVerificar} às ${horarioVerificar} (lógica da interface):\n`);
    
    // Obter o dia da semana
    const data = new Date(dataVerificar);
    const diaSemana = data.getDay(); // 0 = domingo, 1 = segunda, ..., 6 = sábado
    console.log(`Dia da semana para ${dataVerificar}: ${diaSemana}`);
    
    // 1. Buscar todos os agendamentos normais para a data
    const { data: agendamentosData, error } = await supabase
      .from('agendamentos')
      .select('horario')
      .eq('data', dataVerificar)
      .not('status', 'eq', 'cancelado');
    
    if (error) throw error;
    
    // Extrair horários ocupados dos agendamentos normais
    const horariosOcupadosNormais = agendamentosData.map(a => a.horario);
    console.log(`Horários ocupados normais para ${dataVerificar}:`, horariosOcupadosNormais);
    
    // 2. Buscar todos os agendamentos recorrentes para o dia da semana
    const { data: agendamentosRecorrentes, error: errorRecorrentes } = await supabase
      .from('recurring_agendamentos')
      .select('horario')
      .eq('dia_semana', diaSemana)
      .eq('status', 'ativo');
    
    if (errorRecorrentes) throw errorRecorrentes;
    
    // Extrair horários ocupados dos agendamentos recorrentes
    const horariosOcupadosRecorrentes = agendamentosRecorrentes.map(a => a.horario);
    console.log(`Horários ocupados recorrentes para dia ${diaSemana}:`, horariosOcupadosRecorrentes);
    
    // 3. Combinar todos os horários ocupados
    const todosHorariosOcupados = [...new Set([
      ...horariosOcupadosNormais, 
      ...horariosOcupadosRecorrentes
    ])];
    
    // 4. Filtrar horários disponíveis
    const horariosDisponiveis = initialHorariosDisponiveis.filter(h => !todosHorariosOcupados.includes(h));
    console.log(`Horários disponíveis para ${dataVerificar}:`, horariosDisponiveis);
    
    // 5. Verificar se o horário específico está disponível
    const horarioDisponivel = !todosHorariosOcupados.includes(horarioVerificar);
    
    // Verificação adicional para garantir que estamos considerando tanto agendamentos normais quanto recorrentes
    const disponivelNormal = !horariosOcupadosNormais.includes(horarioVerificar);
    const disponivelRecorrente = !horariosOcupadosRecorrentes.includes(horarioVerificar);
    const realmenteDisponivel = disponivelNormal && disponivelRecorrente;
    
    if (horarioDisponivel) {
      console.log(`✅ Horário ${horarioVerificar} está DISPONÍVEL segundo a lógica da interface!`);
    } else {
      console.log(`❌ Horário ${horarioVerificar} está INDISPONÍVEL segundo a lógica da interface!`);
      
      // Verificar qual tipo de agendamento está ocupando o horário
      if (horariosOcupadosNormais.includes(horarioVerificar)) {
        console.log(`  → Ocupado por um agendamento normal`);
        
        // Buscar detalhes do agendamento normal
        const { data: detalhesAgendamento } = await supabase
          .from('agendamentos')
          .select('*')
          .eq('data', dataVerificar)
          .eq('horario', horarioVerificar)
          .not('status', 'eq', 'cancelado');
        
        if (detalhesAgendamento && detalhesAgendamento.length > 0) {
          console.log('  Detalhes do agendamento normal:');
          detalhesAgendamento.forEach(a => {
            console.log(`  - Cliente: ${a.nome}`);
            console.log(`    Serviço: ${a.servico}`);
            console.log(`    Status: ${a.status}`);
            console.log(`    Telefone: ${a.telefone}`);
          });
        }
      }
      
      if (horariosOcupadosRecorrentes.includes(horarioVerificar)) {
        console.log(`  → Ocupado por um agendamento recorrente`);
        
        // Buscar detalhes do agendamento recorrente
        const { data: detalhesAgendamentoRecorrente } = await supabase
          .from('recurring_agendamentos')
          .select('*')
          .eq('dia_semana', diaSemana)
          .eq('horario', horarioVerificar)
          .eq('status', 'ativo');
        
        if (detalhesAgendamentoRecorrente && detalhesAgendamentoRecorrente.length > 0) {
          console.log('  Detalhes do agendamento recorrente:');
          detalhesAgendamentoRecorrente.forEach(a => {
            console.log(`  - Cliente: ${a.nome}`);
            console.log(`    Serviço: ${a.servico}`);
            console.log(`    Status: ${a.status}`);
            console.log(`    Telefone: ${a.telefone}`);
          });
        }
      }
    }
    
    // 6. Verificar se há alguma discrepância com a verificação direta
    console.log('\nVerificando com consulta direta para comparação:');
    
    // Verificar agendamentos normais diretamente
    const { data: agendamentosNormaisDireto, error: errorNormalDireto } = await supabase
      .from('agendamentos')
      .select('*')
      .eq('data', dataVerificar)
      .eq('horario', horarioVerificar)
      .not('status', 'eq', 'cancelado');
    
    if (errorNormalDireto) throw errorNormalDireto;
    
    // Verificar agendamentos recorrentes diretamente
    const { data: agendamentosRecorrentesDireto, error: errorRecorrenteDireto } = await supabase
      .from('recurring_agendamentos')
      .select('*')
      .eq('dia_semana', diaSemana)
      .eq('horario', horarioVerificar)
      .eq('status', 'ativo');
    
    if (errorRecorrenteDireto) throw errorRecorrenteDireto;
    
    const disponibilidadeDireta = agendamentosNormaisDireto.length === 0 && agendamentosRecorrentesDireto.length === 0;
    
    if (disponibilidadeDireta) {
      console.log(`✅ Horário ${horarioVerificar} está DISPONÍVEL segundo a consulta direta!`);
    } else {
      console.log(`❌ Horário ${horarioVerificar} está INDISPONÍVEL segundo a consulta direta!`);
    }
    
    // Verificar se há discrepância
    if (horarioDisponivel !== disponibilidadeDireta) {
      console.log('\n⚠️ DISCREPÂNCIA DETECTADA: A lógica da interface e a consulta direta retornaram resultados diferentes!');
      console.log(`  → Lógica da interface: ${horarioDisponivel ? 'Disponível' : 'Indisponível'}`);
      console.log(`  → Consulta direta: ${disponibilidadeDireta ? 'Disponível' : 'Indisponível'}`);
    } else {
      console.log('\n✓ Sem discrepâncias: A lógica da interface e a consulta direta retornaram o mesmo resultado.');
    }
    
  } catch (error) {
    console.error('Erro ao verificar disponibilidade:', error);
  }
}

verificarDisponibilidadeInterface();