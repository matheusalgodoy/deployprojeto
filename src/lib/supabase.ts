import { createClient } from '@supabase/supabase-js';
import { notificationService } from './notifications';
import { availabilityService } from './availability-service';
import bcryptjs from 'bcryptjs';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const tableName = import.meta.env.VITE_SUPABASE_TABLE_NAME || 'agendamentos';
const usersTable = import.meta.env.VITE_SUPABASE_USERS_TABLE || 'usuarios';

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Credenciais do Supabase não configuradas');
}

// Verificar se as credenciais estão definidas corretamente
console.log('Supabase URL definida:', !!supabaseUrl);
console.log('Supabase Key definida:', !!supabaseAnonKey);

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false
  },
  db: {
    schema: 'public'
  },
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  }
});

// Verificar se a conexão foi estabelecida corretamente
supabase.auth.getSession().then(({ data, error }) => {
  if (error) {
    console.error('Erro ao conectar com o Supabase:', error);
  } else {
    console.log('Conexão com o Supabase estabelecida com sucesso');
  }
});

// Tipos para os dados do agendamento
export interface Agendamento {
  id: string;
  nome: string;
  telefone: string;
  servico: string;
  data: string;
  horario: string;
  status: 'confirmado' | 'cancelado';
  created_at?: string;
  email?: string;
  tipo?: string;
}

// Interface para filtros de subscription
export interface SubscriptionFilters {
  data?: string;
  status?: 'confirmado' | 'cancelado';
  email?: string;
}

// Funções auxiliares para manipulação de agendamentos
export const agendamentoService = {
  async listarAgendamentos() {
    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .order('data', { ascending: true });

    if (error) {
      console.error('Erro ao listar agendamentos:', error);
      throw error;
    }
    return data;
  },
  
  subscribeToAgendamentos(
    callback: (payload: { 
      data: Agendamento[] | null; 
      event: 'INSERT' | 'UPDATE' | 'DELETE';
      old_record?: Agendamento;
      new_record?: Agendamento;
    }) => void,
    filters?: SubscriptionFilters
  ) {
    const channel = supabase
      .channel('agendamentos-changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: tableName },
        async (payload: any) => {
          // Construir a query base
          let query = supabase
            .from(tableName)
            .select('*')
            .order('data', { ascending: true });
          
          // Aplicar filtros se existirem
          if (filters) {
            if (filters.data) {
              query = query.eq('data', filters.data);
            }
            if (filters.status) {
              query = query.eq('status', filters.status);
            }
            if (filters.email) {
              query = query.eq('email', filters.email);
            }
          }
          
          // Buscar dados atualizados
          const { data, error } = await query;
          
          if (error) {
            console.error('Erro ao buscar agendamentos:', error);
            return;
          }
          
          // Enviar dados atualizados com informações do evento
          callback({
            data,
            event: payload.eventType,
            old_record: payload.old_record,
            new_record: payload.new_record
          });
          
          // Invalidar o cache de disponibilidade se necessário
          if (payload.new_record) {
            availabilityService.invalidarCache(
              payload.new_record.data,
              payload.new_record.horario,
              new Date(payload.new_record.data).getDay()
            );
          }
        }
      )
      .subscribe((status) => {
        console.log('Status da subscription:', status);
      });
      
    return () => {
      supabase.removeChannel(channel);
    };
  },

  async criarAgendamento(agendamento: Omit<Agendamento, 'id' | 'created_at'>) {
    // Verificar disponibilidade novamente antes de criar o agendamento
    const dataFormatada = agendamento.data.split('T')[0];
    
    // Verificar se já existe algum agendamento no mesmo horário
    const { data: agendamentosExistentes, error: errorConsulta } = await supabase
      .from(tableName)
      .select('*')
      .eq('data', dataFormatada)
      .eq('horario', agendamento.horario)
      .not('status', 'eq', 'cancelado');
      
    if (errorConsulta) {
      console.error('Erro ao verificar disponibilidade:', errorConsulta);
      throw errorConsulta;
    }
    
    // Se encontrou algum agendamento no mesmo horário, não permite criar
    if (agendamentosExistentes && agendamentosExistentes.length > 0) {
      console.error(`Tentativa de criar agendamento em horário já ocupado: ${agendamento.data} ${agendamento.horario}`);
      throw new Error('Este horário não está mais disponível. Por favor, selecione outro.');
    }
    
    const { data, error } = await supabase
      .from(tableName)
      .insert([agendamento])
      .select();

    if (error) {
      console.error('Erro ao criar agendamento:', error);
      throw error;
    }
    
    console.log(`Agendamento criado com sucesso: ${agendamento.data} ${agendamento.horario}`);
    return data[0];
  },

  async atualizarStatus(id: string, status: Agendamento['status']) {
    const { data, error } = await supabase
      .from(tableName)
      .update({ status })
      .eq('id', id)
      .select();

    if (error) {
      console.error('Erro ao atualizar status:', error);
      throw error;
    }
    
    return data[0];
  },

  async cancelarAgendamento(id: string) {
    // Primeiro buscar os dados do agendamento
    const { data: agendamento, error: fetchError } = await supabase
      .from(tableName)
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !agendamento) {
      console.error('Erro ao buscar agendamento:', fetchError);
      throw fetchError;
    }

    // Atualizar o status para cancelado
    const { data, error } = await supabase
      .from(tableName)
      .update({ status: 'cancelado' })
      .eq('id', id)
      .select();

    if (error) {
      console.error('Erro ao cancelar agendamento:', error);
      throw error;
    }

    // Enviar notificação ao barbeiro via WhatsApp
    await notificationService.enviarNotificacaoCancelamento({
      nome: agendamento.nome,
      servico: agendamento.servico,
      data: new Date(agendamento.data),
      horario: agendamento.horario
    });

    return data[0];
  },

  async verificarDisponibilidade(data: string, horario: string) {
    // Consulta mais rigorosa para verificar disponibilidade
    const { data: agendamentos, error } = await supabase
      .from(tableName)
      .select('*')
      .eq('data', data)
      .eq('horario', horario)
      .not('status', 'eq', 'cancelado');

    if (error) {
      console.error('Erro ao verificar disponibilidade:', error);
      throw error;
    }
    
    // Verificar também agendamentos recorrentes
    const dataObj = new Date(data);
    const diaSemana = dataObj.getDay(); // 0 = domingo, 1 = segunda, ..., 6 = sábado
    
    const { data: agendamentosRecorrentes, error: errorRecorrentes } = await supabase
      .from('recurring_agendamentos')
      .select('*')
      .eq('dia_semana', diaSemana)
      .eq('horario', horario)
      .eq('status', 'ativo');
      
    if (errorRecorrentes) {
      console.error('Erro ao verificar disponibilidade recorrente:', errorRecorrentes);
      throw errorRecorrentes;
    }
    
    const disponivelNormal = agendamentos.length === 0;
    const disponivelRecorrente = agendamentosRecorrentes.length === 0;
    const disponivel = disponivelNormal && disponivelRecorrente;
    
    console.log(`Verificação no banco: ${data} ${horario} - ${disponivel ? 'Disponível' : 'Indisponível'} (${agendamentos.length} agendamentos normais, ${agendamentosRecorrentes.length} agendamentos recorrentes)`);
    return disponivel;
  },

  async listarAgendamentosCliente(email: string) {
    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .eq('email', email)
      .order('data', { ascending: true });

    if (error) {
      console.error('Erro ao listar agendamentos:', error);
      throw error;
    }

    return data;
  },
};

// Função para atualizar a estrutura da tabela
export async function atualizarEstruturaBanco() {
  try {
    // Verificar se a tabela existe
    const { error: checkError } = await supabase
      .from(usersTable)
      .select('*')
      .limit(1);

    if (checkError) {
      // Se a tabela não existe, criar
      const { error: createError } = await supabase.rpc('execute_sql', {
        sql: `
          CREATE TABLE IF NOT EXISTS ${usersTable} (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            nome TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            telefone TEXT NOT NULL,
            senha TEXT NOT NULL,
            tipo TEXT CHECK (tipo IN ('barbeiro', 'cliente')) NOT NULL DEFAULT 'cliente',
            created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, now()) NOT NULL
          );
        `
      });

      if (createError) {
        console.error('Erro ao criar tabela:', createError);
        throw createError;
      }
    } else {
      // Se a tabela existe, adicionar coluna tipo se não existir
      const { error: alterError } = await supabase.rpc('execute_sql', {
        sql: `
          DO $$ 
          BEGIN 
            IF NOT EXISTS (
              SELECT 1 
              FROM information_schema.columns 
              WHERE table_name = '${usersTable}' 
              AND column_name = 'tipo'
            ) THEN 
              ALTER TABLE ${usersTable} 
              ADD COLUMN tipo TEXT CHECK (tipo IN ('barbeiro', 'cliente')) NOT NULL DEFAULT 'cliente';
            END IF;
          END $$;
        `
      });

      if (alterError) {
        console.error('Erro ao adicionar coluna tipo:', alterError);
        throw alterError;
      }
    }

    // Gerar hash da senha padrão (123456)
    const salt = await bcryptjs.genSalt(10);
    const senhaHash = await bcryptjs.hash('123456', salt);

    // Definir o barbeiro padrão
    const { error: updateError } = await supabase
      .from(usersTable)
      .upsert({
        email: 'barber@gansinho.com',
        nome: 'Barbeiro Gansinho',
        telefone: '11999999999',
        senha: senhaHash,
        tipo: 'barbeiro'
      }, {
        onConflict: 'email'
      });

    if (updateError) {
      console.error('Erro ao definir barbeiro padrão:', updateError);
      throw updateError;
    }

    console.log('Estrutura do banco atualizada com sucesso');
    return true;
  } catch (error) {
    console.error('Erro ao atualizar estrutura do banco:', error);
    return false;
  }
}