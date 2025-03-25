import { supabase } from './supabase';
import bcryptjs from 'bcryptjs';

const usersTable = import.meta.env.VITE_SUPABASE_USERS_TABLE || 'usuarios';

export interface Usuario {
  id: string;
  nome: string;
  email: string;
  telefone: string;
  tipo: 'barbeiro' | 'cliente';
  senha: string;
  created_at?: string;
}

// Função para verificar se a tabela existe
async function verificarTabelaUsuarios() {
  try {
    const { data, error } = await supabase
      .from(usersTable)
      .select('*')
      .limit(1);

    if (error) {
      console.error('Erro ao verificar tabela:', error);
      return false;
    }

    return true;
  } catch (err) {
    console.error('Erro ao verificar tabela:', err);
    return false;
  }
}

export const userService = {
  verificarTabela: verificarTabelaUsuarios,

  async cadastrar(usuario: Omit<Usuario, 'id' | 'created_at'>) {
    // Primeiro verificar se a tabela existe
    const tabelaExiste = await verificarTabelaUsuarios();
    if (!tabelaExiste) {
      throw new Error('A tabela de usuários não foi criada ainda. Por favor, execute a migração do banco de dados.');
    }

    // Verificar se já existe um usuário com este email
    const { data: existingUser } = await supabase
      .from(usersTable)
      .select('email')
      .eq('email', usuario.email)
      .single();

    if (existingUser) {
      throw new Error('Este email já está cadastrado');
    }

    // Hash da senha antes de salvar
    const salt = await bcryptjs.genSalt(10);
    const senhaHash = await bcryptjs.hash(usuario.senha, salt);

    // Inserir novo usuário
    const { data, error } = await supabase
      .from(usersTable)
      .insert([{ ...usuario, senha: senhaHash }])
      .select()
      .single();

    if (error) {
      console.error('Erro ao cadastrar usuário:', error);
      throw new Error('Erro ao cadastrar usuário');
    }

    return data;
  },

  async login(email: string, senha: string) {
    try {
      // Primeiro verificar se a tabela existe
      const tabelaExiste = await verificarTabelaUsuarios();
      if (!tabelaExiste) {
        throw new Error('A tabela de usuários não foi criada ainda. Por favor, execute a migração do banco de dados.');
      }

      // Buscar usuário pelo email
      const { data: usuario, error } = await supabase
        .from(usersTable)
        .select('*')
        .eq('email', email)
        .single();

      if (error || !usuario) {
        console.error('Erro ao buscar usuário:', error);
        throw new Error('Usuário não encontrado');
      }

      // Verificar senha
      const senhaCorreta = await bcryptjs.compare(senha, usuario.senha);
      if (!senhaCorreta) {
        throw new Error('Senha incorreta');
      }

      // Remover a senha do objeto antes de retornar
      const { senha: _, ...usuarioSemSenha } = usuario;

      return {
        data: usuarioSemSenha,
        error: null
      };
    } catch (error: any) {
      console.error('Erro no login:', error);
      return {
        data: null,
        error: error
      };
    }
  }
};
