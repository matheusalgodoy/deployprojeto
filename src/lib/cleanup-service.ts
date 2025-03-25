import { supabase } from './supabase';
import { format, subDays } from 'date-fns';

// Serviço para limpeza automática de agendamentos
export const cleanupService = {
  /**
   * Remove agendamentos cancelados e expirados do banco de dados
   * @returns Número de agendamentos removidos
   */
  async executarLimpeza() {
    try {
      // Calcula a data limite (ontem)
      const dataLimite = format(subDays(new Date(), 1), 'yyyy-MM-dd');

      // Remove agendamentos cancelados e expirados em uma única operação
      const { data, error, count } = await supabase
        .from('agendamentos')
        .delete()
        .or(`status.eq.cancelado,data.lt.${dataLimite}`)
        .select('id, data, status');

      if (error) {
        console.error('Erro ao executar limpeza de agendamentos:', error);
        throw error;
      }

      // Separar os resultados para logging
      const cancelados = data?.filter(a => a.status === 'cancelado').length || 0;
      const expirados = data?.filter(a => new Date(a.data) < new Date(dataLimite)).length || 0;

      console.log(`Limpeza concluída:
        - ${cancelados} agendamentos cancelados removidos
        - ${expirados} agendamentos expirados removidos
        - Total: ${count} agendamentos removidos`);

      return {
        cancelados,
        expirados,
        total: count || 0
      };
    } catch (error) {
      console.error('Erro ao executar limpeza:', error);
      throw error;
    }
  }
};