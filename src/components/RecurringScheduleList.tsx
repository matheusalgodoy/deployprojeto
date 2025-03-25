import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog } from "@/components/ui/dialog";
import { DialogContent } from "@/components/ui/dialog";
import { DialogHeader } from "@/components/ui/dialog";
import { DialogTitle } from "@/components/ui/dialog";
import { recurringAgendamentoService, type RecurringAgendamento } from "@/lib/recurring-agendamentos";
import { useToast } from "@/hooks/use-toast";

interface RecurringScheduleListProps {
  onAgendamentoUpdated: () => void;
}

export function RecurringScheduleList({ onAgendamentoUpdated }: RecurringScheduleListProps) {
  const { toast } = useToast();
  const [agendamentos, setAgendamentos] = useState<RecurringAgendamento[]>([]);
  const [loading, setLoading] = useState(false);

  const diasSemana = [
    "Domingo",
    "Segunda-feira",
    "Terça-feira",
    "Quarta-feira",
    "Quinta-feira",
    "Sexta-feira",
    "Sábado",
  ];

  useEffect(() => {
    carregarAgendamentos();
  }, []);

  const carregarAgendamentos = async () => {
    try {
      const data = await recurringAgendamentoService.listarAgendamentos();
      setAgendamentos(data);
    } catch (error) {
      console.error("Erro ao carregar agendamentos recorrentes:", error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os agendamentos recorrentes.",
      });
    }
  };

  const atualizarStatus = async (id: string, novoStatus: 'ativo' | 'inativo') => {
    try {
      setLoading(true);
      await recurringAgendamentoService.atualizarStatus(id, novoStatus);
      await carregarAgendamentos();
      onAgendamentoUpdated();
      
      toast({
        title: "Status atualizado",
        description: `O agendamento recorrente foi ${novoStatus === 'ativo' ? 'ativado' : 'desativado'} com sucesso!`,
      });
    } catch (error) {
      console.error("Erro ao atualizar status:", error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o status do agendamento.",
      });
    } finally {
      setLoading(false);
    }
  };

  const [agendamentoParaDeletar, setAgendamentoParaDeletar] = useState<string | null>(null);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);

  const deletarAgendamento = async (id: string) => {
    try {
      setLoading(true);
      await recurringAgendamentoService.deletarAgendamento(id);
      await carregarAgendamentos();
      onAgendamentoUpdated();
      
      toast({
        title: "Agendamento excluído",
        description: "O agendamento recorrente foi excluído com sucesso!",
        variant: "default"
      });
      setConfirmDialogOpen(false);
    } catch (error) {
      console.error("Erro ao deletar agendamento:", error);
      toast({
        title: "Erro",
        description: "Não foi possível excluir o agendamento.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
      setAgendamentoParaDeletar(null);
    }
  };

  const confirmarDelecao = (id: string) => {
    setAgendamentoParaDeletar(id);
    setConfirmDialogOpen(true);
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Agendamentos Recorrentes</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center items-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            </div>
          ) : agendamentos.length === 0 ? (
            <p className="text-center text-gray-500 py-8">
              Nenhum agendamento recorrente cadastrado
            </p>
          ) : (
            <div className="space-y-4">
              {agendamentos.map((agendamento) => (
              <div
                key={agendamento.id}
                className="p-4 border rounded-lg bg-white shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {agendamento.nome}
                    </h3>
                    <div className="mt-2 space-y-1">
                      <p className="text-sm font-medium text-gray-700">
                        <span className="font-semibold">Telefone:</span>{" "}
                        {agendamento.telefone}
                      </p>
                      <p className="text-sm font-medium text-gray-700">
                        <span className="font-semibold">Serviço:</span>{" "}
                        {agendamento.servico}
                      </p>
                      <p className="text-sm font-medium text-gray-700">
                        <span className="font-semibold">Dia da semana:</span>{" "}
                        {diasSemana[agendamento.dia_semana]}
                      </p>
                      <p className="text-sm font-medium text-gray-700">
                        <span className="font-semibold">Horário:</span>{" "}
                        {agendamento.horario}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end space-y-2">
                    <Badge
                      className={`${agendamento.status === 'ativo' ? 'bg-green-500' : 'bg-red-500'} text-white px-3 py-1`}
                    >
                      {agendamento.status === 'ativo' ? 'Ativo' : 'Inativo'}
                    </Badge>
                    <div className="flex space-x-2 mt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className={`${agendamento.status === 'ativo' ? 'bg-red-50 hover:bg-red-100 text-red-700 border-red-200' : 'bg-green-50 hover:bg-green-100 text-green-700 border-green-200'}`}
                        onClick={() => atualizarStatus(agendamento.id, agendamento.status === 'ativo' ? 'inativo' : 'ativo')}
                        disabled={loading}
                      >
                        {agendamento.status === 'ativo' ? 'Desativar' : 'Ativar'}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="bg-red-50 hover:bg-red-100 text-red-700 border-red-200"
                        onClick={() => confirmarDelecao(agendamento.id)}
                        disabled={loading}
                      >
                        {loading ? "Excluindo..." : "Excluir"}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>

    <Dialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Confirmar exclusão</DialogTitle>
        </DialogHeader>
        <div className="py-4">
          <p>Tem certeza que deseja excluir este agendamento recorrente?</p>
          <p className="text-sm text-gray-500 mt-2">Esta ação não pode ser desfeita.</p>
        </div>
        <div className="flex justify-end space-x-2">
          <Button
            variant="outline"
            onClick={() => setConfirmDialogOpen(false)}
            disabled={loading}
          >
            Cancelar
          </Button>
          <Button
            variant="destructive"
            onClick={() => agendamentoParaDeletar && deletarAgendamento(agendamentoParaDeletar)}
            disabled={loading}
          >
            {loading ? "Excluindo..." : "Excluir"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
    </>
  );
}