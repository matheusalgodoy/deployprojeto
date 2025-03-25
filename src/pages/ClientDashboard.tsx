import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { agendamentoService } from "@/lib/supabase";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface Agendamento {
  id: string;
  nome: string;
  telefone: string;
  servico: string;
  data: Date;
  horario: string;
  status: "confirmado" | "cancelado" | "pendente";
}

export function ClientDashboard() {
  const { toast } = useToast();
  const [agendamentos, setAgendamentos] = useState<Agendamento[]>([]);
  const [loading, setLoading] = useState(true);
  const [agendamentoCancelar, setAgendamentoCancelar] = useState<string | null>(null);
  const clienteEmail = localStorage.getItem("client_auth_email");

  useEffect(() => {
    const carregarAgendamentos = async () => {
      try {
        const data = await agendamentoService.listarAgendamentosCliente(clienteEmail || "");
        setAgendamentos(data.map(a => ({
          ...a,
          data: new Date(`${a.data}T00:00:00-03:00`) // Ajustando para o fuso horário de Brasília
        })));
      } catch (error) {
        console.error('Erro ao carregar agendamentos:', error);
        toast({
          title: "Erro",
          description: "Não foi possível carregar seus agendamentos.",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    carregarAgendamentos();

    const unsubscribe = agendamentoService.subscribeToAgendamentos(({ data }) => {
      if (data) {
        setAgendamentos(data.map(a => ({
          ...a,
          data: new Date(`${a.data}T00:00:00-03:00`) // Ajustando para o fuso horário de Brasília
        })));
      }
    }, { email: clienteEmail || "" });

    return () => {
      unsubscribe();
    };
  }, [toast, clienteEmail]);

  const handleCancelar = async (id: string) => {
    try {
      setLoading(true);
      await agendamentoService.cancelarAgendamento(id);
      
      // Atualizar o estado local imediatamente
      setAgendamentos(prevAgendamentos => 
        prevAgendamentos.map(a => 
          a.id === id ? { ...a, status: "cancelado" } : a
        )
      );

      toast({
        title: "Agendamento cancelado",
        description: "O barbeiro foi notificado do cancelamento.",
      });
    } catch (error) {
      console.error('Erro ao cancelar agendamento:', error);
      toast({
        title: "Erro",
        description: "Não foi possível cancelar o agendamento.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
      setAgendamentoCancelar(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "confirmado":
        return "bg-green-500";
      case "cancelado":
        return "bg-red-500";
      default:
        return "bg-yellow-500";
    }
  };

  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0); // Resetar as horas para comparação apenas da data

  const agendamentosFuturos = agendamentos
    .filter(a => {
      const dataAgendamento = new Date(a.data);
      dataAgendamento.setHours(0, 0, 0, 0);
      return dataAgendamento >= hoje && a.status !== "cancelado";
    })
    .sort((a, b) => a.data.getTime() - b.data.getTime());
  
  const agendamentosPassados = agendamentos
    .filter(a => {
      const dataAgendamento = new Date(a.data);
      dataAgendamento.setHours(0, 0, 0, 0);
      return dataAgendamento < hoje || a.status === "cancelado";
    })
    .sort((a, b) => b.data.getTime() - a.data.getTime());

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 flex flex-col">
      {loading && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
        </div>
      )}
      <header className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <Link to="/" className="flex items-center space-x-3">
            <Avatar className="h-10 w-10">
              <AvatarImage
                src="/lovable-uploads/a313fca3-1781-4832-a011-eb22c0d3b248.png"
                alt="Logo Barbearia do Gansinho"
              />
              <AvatarFallback>BG</AvatarFallback>
            </Avatar>
            <h1 className="text-xl font-bold text-gray-900">Barbearia do Gansinho - Meus Agendamentos</h1>
          </Link>
          <div className="flex space-x-4">
            <Button variant="default" asChild>
              <Link to="/agendar">Novo Agendamento</Link>
            </Button>
            <Button 
              variant="outline"
              onClick={() => {
                localStorage.removeItem("client_auth_token");
                localStorage.removeItem("client_auth_timestamp");
                localStorage.removeItem("client_auth_email");
                localStorage.removeItem("client_authenticated");
                window.location.href = "/";
              }}
            >
              Sair
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="space-y-8">
          {/* Próximos Agendamentos */}
          <Card>
            <CardHeader>
              <CardTitle>Próximos Agendamentos</CardTitle>
            </CardHeader>
            <CardContent>
              {agendamentosFuturos.length === 0 ? (
                <p className="text-gray-500 text-center py-4">
                  Você não tem agendamentos futuros
                </p>
              ) : (
                <div className="space-y-4">
                  {agendamentosFuturos.map((agendamento) => (
                    <div
                      key={agendamento.id}
                      className="flex items-center justify-between p-4 bg-white rounded-lg shadow"
                    >
                      <div>
                        <h3 className="font-medium">{agendamento.servico}</h3>
                        <p className="text-sm text-gray-500">
                          Data: {format(agendamento.data, "dd 'de' MMMM", { locale: ptBR })}
                        </p>
                        <p className="text-sm text-gray-500">
                          Horário: {agendamento.horario}
                        </p>
                      </div>
                      <div className="flex items-center space-x-4">
                        <Badge className={getStatusColor(agendamento.status)}>
                          {agendamento.status}
                        </Badge>
                        {agendamento.status !== "cancelado" && (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="destructive" size="sm">
                                Cancelar
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Cancelar agendamento?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Tem certeza que deseja cancelar este agendamento? O barbeiro será notificado do cancelamento.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Não, manter</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleCancelar(agendamento.id)}
                                  className="bg-red-500 hover:bg-red-600"
                                >
                                  Sim, cancelar
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Histórico de Agendamentos */}
          <Card>
            <CardHeader>
              <CardTitle>Histórico de Agendamentos</CardTitle>
            </CardHeader>
            <CardContent>
              {agendamentosPassados.length === 0 ? (
                <p className="text-gray-500 text-center py-4">
                  Você não tem histórico de agendamentos
                </p>
              ) : (
                <div className="space-y-4">
                  {agendamentosPassados.map((agendamento) => (
                    <div
                      key={agendamento.id}
                      className="flex items-center justify-between p-4 bg-white rounded-lg shadow opacity-75"
                    >
                      <div>
                        <h3 className="font-medium">{agendamento.servico}</h3>
                        <p className="text-sm text-gray-500">
                          Data: {format(agendamento.data, "dd 'de' MMMM", { locale: ptBR })}
                        </p>
                        <p className="text-sm text-gray-500">
                          Horário: {agendamento.horario}
                        </p>
                      </div>
                      <Badge className={getStatusColor(agendamento.status)}>
                        {agendamento.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
