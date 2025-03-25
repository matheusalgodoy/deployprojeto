import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { cleanupService } from "@/lib/cleanup-service";
import { useToast } from "@/hooks/use-toast";

interface CleanupResult {
  cancelados: number;
  expirados: number;
  total: number;
}

export function CleanupDashboard() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [resultado, setResultado] = useState<CleanupResult | null>(null);

  const executarLimpeza = async () => {
    try {
      setLoading(true);
      const resultado = await cleanupService.executarLimpeza();
      setResultado(resultado);
      
      toast({
        title: "Limpeza concluída",
        description: `Foram removidos ${resultado.total} agendamentos (${resultado.cancelados} cancelados e ${resultado.expirados} expirados).`,
      });
    } catch (error) {
      console.error('Erro ao executar limpeza:', error);
      toast({
        title: "Erro",
        description: "Não foi possível executar a limpeza dos agendamentos.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Limpeza de Agendamentos</CardTitle>
        <CardDescription>
          Remova agendamentos comuns cancelados e expirados do banco de dados para liberar espaço. Esta ação não afeta os agendamentos recorrentes.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="space-y-2">
            <h3 className="text-sm font-medium">O que será removido:</h3>
            <ul className="list-disc pl-5 text-sm text-gray-500 space-y-1">
              <li>Todos os agendamentos comuns com status <strong>cancelado</strong></li>
              <li>Todos os agendamentos comuns com data anterior a <strong>ontem</strong></li>
            </ul>
          </div>
          
          {resultado && (
            <div className="mt-4 p-4 bg-gray-50 rounded-md">
              <h3 className="text-sm font-medium mb-2">Resultado da última limpeza:</h3>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-2xl font-bold">{resultado.cancelados}</p>
                  <p className="text-xs text-gray-500">Cancelados</p>
                </div>
                <div>
                  <p className="text-2xl font-bold">{resultado.expirados}</p>
                  <p className="text-xs text-gray-500">Expirados</p>
                </div>
                <div>
                  <p className="text-2xl font-bold">{resultado.total}</p>
                  <p className="text-xs text-gray-500">Total</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter>
        <Button 
          onClick={executarLimpeza} 
          disabled={loading}
          className="w-full"
        >
          {loading ? "Executando limpeza..." : "Executar Limpeza Agora"}
        </Button>
      </CardFooter>
    </Card>
  );
}