import { cache } from './cache';
import { agendamentoService, supabase } from './supabase';
import { recurringAgendamentoService } from './recurring-agendamentos';
import { getDuracaoServico } from './servicos';

// Tempo de expiração do cache em milissegundos
const CACHE_EXPIRATION = 3000; // 3 segundos

// Chaves para o cache
const getNormalCacheKey = (data: string, horario: string) => `normal_${data}_${horario}`;
const getRecurringCacheKey = (diaSemana: number, horario: string) => `recurring_${diaSemana}_${horario}`;
const getAvailableTimesCacheKey = (data: string) => `available_times_${data}`;

// Interface para horários disponíveis
interface AvailableTimes {
  horarios: string[];
  timestamp: number;
}

// Função para converter horário em minutos
const horarioParaMinutos = (horario: string): number => {
  const [horas, minutos] = horario.split(':').map(Number);
  return horas * 60 + minutos;
};

// Função para verificar sobreposição de horários
const verificarSobreposicao = (
  horarioInicio1: string,
  duracao1: number,
  horarioInicio2: string,
  duracao2: number
): boolean => {
  const inicio1 = horarioParaMinutos(horarioInicio1);
  const fim1 = inicio1 + duracao1; // duracao1 já está em minutos
  const inicio2 = horarioParaMinutos(horarioInicio2);
  const fim2 = inicio2 + duracao2; // duracao2 já está em minutos

  // Exemplo:
  // Agendamento1: 09:00 (início1) até 09:50 (fim1) - Corte + Barba (50min)
  // Agendamento2: 09:30 (início2) até 10:00 (fim2) - Corte (30min)
  // início1 (540) < fim2 (600) && fim1 (590) > início2 (570) = true (há sobreposição)
  return (inicio1 < fim2 && fim1 > inicio2);
};

// Serviço otimizado para verificação de disponibilidade
export const availabilityService = {
  // Verifica disponibilidade para agendamentos normais com cache
  async verificarDisponibilidadeNormal(
    data: string,
    horario: string,
    duracaoServico: number
  ): Promise<boolean> {
    console.log(`Verificando disponibilidade para ${data} ${horario} (duração: ${duracaoServico}min)`);
    
    try {
      // Verificar agendamentos normais
      const { data: agendamentosNormais, error } = await supabase
        .from('agendamentos')
        .select('*')
        .eq('data', data)
        .not('status', 'eq', 'cancelado');

      if (error) throw error;

      // Verificar sobreposição com outros agendamentos
      const temSobreposicao = agendamentosNormais.some(agendamento => {
        const duracaoExistente = getDuracaoServico(agendamento.servico);
        return verificarSobreposicao(
          agendamento.horario, // horário do agendamento existente
          duracaoExistente,   // duração do agendamento existente
          horario,            // horário do novo agendamento
          duracaoServico      // duração do novo agendamento
        );
      });

      if (temSobreposicao) {
        console.log(`Horário ${horario} na data ${data} conflita com outro agendamento`);
        return false;
      }

      // Verificar também agendamentos recorrentes
      const dataObj = new Date(data);
      const diaSemana = dataObj.getDay();

      const { data: agendamentosRecorrentes, error: errorRecorrentes } = await supabase
        .from('recurring_agendamentos')
        .select('*')
        .eq('dia_semana', diaSemana)
        .eq('status', 'ativo');

      if (errorRecorrentes) throw errorRecorrentes;

      // Verificar sobreposição com agendamentos recorrentes
      const temSobreposicaoRecorrente = agendamentosRecorrentes.some(agendamento => {
        const duracaoRecorrente = getDuracaoServico(agendamento.servico);
        return verificarSobreposicao(
          agendamento.horario, // horário do agendamento existente
          duracaoRecorrente,   // duração do agendamento existente
          horario,            // horário do novo agendamento
          duracaoServico      // duração do novo agendamento
        );
      });

      if (temSobreposicaoRecorrente) {
        console.log(`Horário ${horario} na data ${data} conflita com agendamento recorrente`);
        return false;
      }

      console.log(`Horário ${horario} na data ${data} está disponível`);
      return true;
    } catch (error) {
      console.error('Erro ao verificar disponibilidade:', error);
      throw error;
    }
  },
  
  // Verifica disponibilidade para agendamentos recorrentes sem cache
  async verificarDisponibilidadeRecorrente(
    diaSemana: number,
    horario: string,
    duracaoServico: number
  ): Promise<boolean> {
    console.log(`Verificando disponibilidade recorrente para dia ${diaSemana} às ${horario}`);
    
    try {
      const disponivel = await recurringAgendamentoService.verificarDisponibilidade(
        diaSemana,
        horario,
        duracaoServico
      );
      return disponivel;
    } catch (error) {
      console.error('Erro ao verificar disponibilidade recorrente:', error);
      return false;
    }
  },
  
  // Obtém todos os horários disponíveis para uma data específica
  async obterHorariosDisponiveis(
    data: string,
    diaSemana: number,
    horariosIniciais: string[],
    duracaoServico: number
  ): Promise<string[]> {
    console.log(`Verificando horários disponíveis para ${data}`);
    
    try {
      // Verificar agendamentos normais
      const { data: agendamentosNormais, error } = await supabase
        .from('agendamentos')
        .select('*')
        .eq('data', data)
        .not('status', 'eq', 'cancelado');

      if (error) throw error;

      // Verificar agendamentos recorrentes
      const { data: agendamentosRecorrentes, error: errorRecorrentes } = await supabase
        .from('recurring_agendamentos')
        .select('*')
        .eq('dia_semana', diaSemana)
        .eq('status', 'ativo');

      if (errorRecorrentes) throw errorRecorrentes;

      // Filtrar horários disponíveis considerando a duração dos serviços
      const horariosDisponiveis = horariosIniciais.filter(horario => {
        // Verificar sobreposição com agendamentos normais
        const temSobreposicaoNormal = agendamentosNormais.some(agendamento => {
          const duracaoExistente = getDuracaoServico(agendamento.servico);
          return verificarSobreposicao(
            agendamento.horario, // horário do agendamento existente
            duracaoExistente,   // duração do agendamento existente
            horario,            // horário do novo agendamento
            duracaoServico      // duração do novo agendamento
          );
        });

        // Verificar sobreposição com agendamentos recorrentes
        const temSobreposicaoRecorrente = agendamentosRecorrentes.some(agendamento => {
          const duracaoRecorrente = getDuracaoServico(agendamento.servico);
          return verificarSobreposicao(
            agendamento.horario, // horário do agendamento existente
            duracaoRecorrente,   // duração do agendamento existente
            horario,            // horário do novo agendamento
            duracaoServico      // duração do novo agendamento
          );
        });

        return !temSobreposicaoNormal && !temSobreposicaoRecorrente;
      });

      return horariosDisponiveis;
    } catch (error) {
      console.error('Erro ao obter horários disponíveis:', error);
      throw error;
    }
  },

  // Invalida o cache para um horário específico
  invalidarCache(data: string, horario: string, diaSemana: number): void {
    const normalKey = getNormalCacheKey(data, horario);
    const recurringKey = getRecurringCacheKey(diaSemana, horario);
    const availableTimesKey = getAvailableTimesCacheKey(data);
    
    cache.remove(normalKey);
    cache.remove(recurringKey);
    cache.remove(availableTimesKey);
  },

  // Limpa todo o cache
  limparCache(): void {
    cache.clear();
  }
};