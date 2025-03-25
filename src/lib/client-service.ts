import { supabase } from './supabase';

export interface ClienteInfo {
  nome: string;
  telefone: string;
  email: string;
}

export const clientService = {
  async buscarInformacoesCliente(email: string): Promise<ClienteInfo | null> {
    try {
      const { data, error } = await supabase
        .from('usuarios')
        .select('nome, telefone, email')
        .eq('email', email)
        .single();

      if (error) {
        console.error('Erro ao buscar informações do cliente:', error);
        return null;
      }

      if (!data) {
        return null;
      }

      return {
        nome: data.nome,
        telefone: data.telefone,
        email: data.email
      };
    } catch (error) {
      console.error('Erro ao buscar informações do cliente:', error);
      return null;
    }
  }
};
