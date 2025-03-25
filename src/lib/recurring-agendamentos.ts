import { supabase } from './supabase';
import { getDuracaoServico } from './servicos';

export interface RecurringAgendamento {
  id: string;
  nome: string;
  telefone: string;
  servico: string;
  dia_semana: number;
  horario: string;
  status: 'ativo' | 'inativo';
  created_at: string;
}

// Função para converter horário em minutos
const horarioParaMinutos = (horario: string): number => {
  const [horas, minutos] = horario.split(':').map(Number);
  return horas * 60 + minutos;
};

// Função para verificar sobreposição entre dois agendamentos
const verificarSobreposicao = (
  horarioInicio1: string,
  duracao1: number,
  horarioInicio2: string,
  duracao2: number
): boolean => {
  const inicio1 = horarioParaMinutos(horarioInicio1);
  const fim1 = inicio1 + duracao1;
  const inicio2 = horarioParaMinutos(horarioInicio2);
  const fim2 = inicio2 + duracao2;

  return (inicio1 < fim2 && fim1 > inicio2);
};

export const recurringAgendamentoService = {
  async listarAgendamentos() {
    const { data, error } = await supabase
      .from('recurring_agendamentos')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data as RecurringAgendamento[];
  },

  async criarAgendamento(agendamento: Omit<RecurringAgendamento, 'id' | 'created_at'>) {
    const { data, error } = await supabase
      .from('recurring_agendamentos')
      .insert([agendamento])
      .select()
      .single();

    if (error) throw error;
    return data as RecurringAgendamento;
  },

  async atualizarStatus(id: string, status: 'ativo' | 'inativo') {
    const { data, error } = await supabase
      .from('recurring_agendamentos')
      .update({ status })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as RecurringAgendamento;
  },

  async verificarDisponibilidade(dia_semana: number, horario: string, duracaoServico: number) {
    console.log(`Verificando disponibilidade recorrente para dia ${dia_semana} às ${horario}`);
    
    try {
      const { data, error } = await supabase
        .from('recurring_agendamentos')
        .select('*')
        .eq('dia_semana', dia_semana)
        .eq('status', 'ativo');

      if (error) {
        console.error('Erro ao verificar disponibilidade recorrente:', error);
        throw error;
      }
      
      // Verificar sobreposição com outros agendamentos recorrentes
      const temSobreposicao = data.some(agendamento => {
        const duracaoExistente = getDuracaoServico(agendamento.servico);
        return verificarSobreposicao(
          horario,
          duracaoServico,
          agendamento.horario,
          duracaoExistente
        );
      });

      console.log(`Resultado da verificação recorrente para dia ${dia_semana} às ${horario}: ${!temSobreposicao ? 'Disponível' : 'Indisponível'}`);
      return !temSobreposicao;
    } catch (error) {
      console.error('Erro ao verificar disponibilidade recorrente:', error);
      throw error;
    }
  },

  async deletarAgendamento(id: string) {
    const { error } = await supabase
      .from('recurring_agendamentos')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }
};