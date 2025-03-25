import { useEffect, useState } from 'react';
import { userService } from '@/lib/users';

export default function TestDB() {
  const [status, setStatus] = useState<string>('Verificando...');

  useEffect(() => {
    async function verificarTabela() {
      try {
        const existe = await userService.verificarTabela();
        setStatus(existe ? 'A tabela usuarios existe!' : 'A tabela usuarios NÃO existe. Execute a migração.');
      } catch (err) {
        setStatus('Erro ao verificar tabela: ' + (err instanceof Error ? err.message : String(err)));
      }
    }
    verificarTabela();
  }, []);

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold mb-4">Teste do Banco de Dados</h1>
      <p>{status}</p>
    </div>
  );
}
