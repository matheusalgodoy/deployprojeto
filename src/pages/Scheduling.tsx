import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { format, addMonths } from "date-fns";
import { ptBR } from "date-fns/locale";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Calendar } from "@/components/ui/calendar";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { cn, formatarTelefoneWhatsApp } from "@/lib/utils";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { agendamentoService, supabase, type Agendamento } from "@/lib/supabase";
import { recurringAgendamentoService } from "@/lib/recurring-agendamentos";
import { availabilityService } from "@/lib/availability-service";
import { clientService } from "@/lib/client-service";
import { horariosService } from "@/lib/horarios-service";
import { servicos } from "@/lib/servicos";

// Importar número de telefone da barbearia das constantes
import { BARBEARIA_TELEFONE } from "@/lib/constants";

const formSchema = z.object({
  nome: z.string().min(2, "O nome deve ter pelo menos 2 caracteres"),
  telefone: z.string().min(10, "Telefone inválido"),
});

const Scheduling = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [confirmarDialog, setConfirmarDialog] = useState(false);
  const [servicoSelecionado, setServicoSelecionado] = useState<string>("");
  const [dataSelecionada, setDataSelecionada] = useState<Date>();
  const [horarioSelecionado, setHorarioSelecionado] = useState<string>("");
  const [horariosDisponiveis, setHorariosDisponiveis] = useState<string[]>([]);
  const [agendamentos, setAgendamentos] = useState<Agendamento[]>([]);

  // Configurar o formulário
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nome: "",
      telefone: "",
    },
  });

  // Debug do estado do formulário
  useEffect(() => {
    const subscription = form.watch((value) => {
      console.log("Form values changed:", value);
      console.log("Form state:", form.formState);
    });
    return () => subscription.unsubscribe();
  }, [form]);

  // Efeito para atualizar o serviço no formulário quando ele é selecionado
  useEffect(() => {
    if (servicoSelecionado) {
      console.log("Atualizando serviço no formulário:", servicoSelecionado);
    }
  }, [servicoSelecionado]);

  // Efeito para atualizar o horário no formulário quando ele é selecionado
  useEffect(() => {
    if (horarioSelecionado) {
      console.log("Atualizando horário no formulário:", horarioSelecionado);
    }
  }, [horarioSelecionado]);

  // Efeito para atualizar os horários disponíveis quando a data ou serviço mudam
  useEffect(() => {
    const atualizarHorariosDisponiveis = async () => {
      if (dataSelecionada && servicoSelecionado) {
        console.log("Buscando horários disponíveis para:", {
          data: format(dataSelecionada, "yyyy-MM-dd"),
          servico: servicoSelecionado
        });
        
        const servicoObj = servicos.find(s => s.nome === servicoSelecionado);
        if (servicoObj) {
          try {
            const horarios = await availabilityService.obterHorariosDisponiveis(
              format(dataSelecionada, "yyyy-MM-dd"),
              dataSelecionada.getDay(),
              horariosService.getHorariosIniciais(),
              servicoObj.duracao
            );
            console.log("Horários disponíveis:", horarios);
            setHorariosDisponiveis(horarios);
          } catch (error) {
            console.error("Erro ao buscar horários disponíveis:", error);
            setHorariosDisponiveis([]);
          }
        }
      }
    };

    atualizarHorariosDisponiveis();
  }, [dataSelecionada, servicoSelecionado]);

  // Verificar autenticação e carregar dados do cliente
  useEffect(() => {
    const isAuthenticated = localStorage.getItem("client_authenticated") === "true";
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }

    // Carregar informações do cliente
    const carregarDadosCliente = async () => {
      const clienteEmail = localStorage.getItem("client_auth_email");
      if (!clienteEmail) return;

      try {
        setLoading(true);
        const dadosCliente = await clientService.buscarInformacoesCliente(clienteEmail);
        
        if (dadosCliente) {
          // Preencher o formulário com os dados do cliente
          form.setValue("nome", dadosCliente.nome);
          form.setValue("telefone", dadosCliente.telefone);
        }
      } catch (error) {
        console.error('Erro ao carregar dados do cliente:', error);
        toast({
          title: "Erro",
          description: "Não foi possível carregar seus dados. Por favor, preencha manualmente.",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    carregarDadosCliente();
  }, [navigate, form, toast]);

  // Carregar agendamentos ao montar o componente
  useEffect(() => {
    const carregarAgendamentos = async () => {
      try {
        const data = await agendamentoService.listarAgendamentos();
        setAgendamentos(data);
      } catch (error) {
        console.error('Erro ao carregar agendamentos:', error);
      }
    };

    carregarAgendamentos();
  }, []);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      setError(null);
      setLoading(true);
      console.log("Iniciando agendamento com valores:", values);
      console.log("Data selecionada:", dataSelecionada);
      console.log("Serviço selecionado:", servicoSelecionado);
      
      // Validar se todos os campos necessários estão preenchidos
      if (!values.nome || !values.telefone || !servicoSelecionado || !horarioSelecionado || !dataSelecionada) {
        throw new Error("Por favor, preencha todos os campos");
      }

      // Criar o agendamento
      const agendamento = {
        nome: values.nome,
        telefone: formatarTelefoneWhatsApp(values.telefone),
        servico: servicoSelecionado, 
        data: format(dataSelecionada, "yyyy-MM-dd"),
        horario: horarioSelecionado, 
        status: 'confirmado' as const,
        email: localStorage.getItem("client_auth_email") || ""
      };

      console.log("Tentando criar agendamento:", agendamento);

      // Salvar o agendamento
      const novoAgendamento = await agendamentoService.criarAgendamento(agendamento);
      console.log("Agendamento criado:", novoAgendamento);

      // Atualizar lista de agendamentos
      const novosAgendamentos = await agendamentoService.listarAgendamentos();
      setAgendamentos(novosAgendamentos);

      // Atualizar horários disponíveis
      if (dataSelecionada && servicoSelecionado) {
        const horarios = await availabilityService.obterHorariosDisponiveis(
          format(dataSelecionada, "yyyy-MM-dd"),
          dataSelecionada.getDay(),
          horariosService.getHorariosIniciais(),
          servicos.find(s => s.nome === servicoSelecionado)?.duracao
        );
        setHorariosDisponiveis(horarios);
      }

      // Mensagem para o cliente
      const mensagemCliente = `Olá! Gostaria de agendar um horário na Barbearia do Gansinho.\n\nServiço: ${servicoSelecionado}\nData: ${format(dataSelecionada, "dd/MM/yyyy", { locale: ptBR })}\nHorário: ${horarioSelecionado}\nNome: ${values.nome}\nTelefone: ${values.telefone}`;
      
      // Codificar a mensagem para URL
      const mensagemClienteCodificada = encodeURIComponent(mensagemCliente);
      
      // Construir o link do WhatsApp para o cliente com o telefone formatado
      const telefoneFormatado = formatarTelefoneWhatsApp(BARBEARIA_TELEFONE);
      const linkWhatsAppCliente = `https://wa.me/${telefoneFormatado}?text=${mensagemClienteCodificada}`;
      
      // Mostrar mensagem de sucesso
      toast({
        title: "Agendamento confirmado!",
        description: "Você será redirecionado para o WhatsApp para confirmar seu agendamento.",
      });
      
      // Limpar o formulário
      form.reset();
      setServicoSelecionado("");
      setHorarioSelecionado("");
      setDataSelecionada(undefined);
      
      // Abrir o link em uma nova aba para o cliente após tudo estar concluído
      window.open(linkWhatsAppCliente, "_blank");
    } catch (err: any) {
      console.error('Erro ao processar agendamento:', err);
      toast({
        title: "Erro ao processar agendamento",
        description: err.message || "Ocorreu um erro ao processar seu agendamento. Por favor, tente novamente.",
        variant: "destructive"
      });
      setError(err.message || "Ocorreu um erro ao processar seu agendamento");
    } finally {
      setLoading(false);
    }
  };

  const handleCancelarDialog = () => {
    setConfirmarDialog(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 flex flex-col">
      {loading && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
        </div>
      )}
      
      <header className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-4 flex flex-col sm:flex-row justify-between items-center gap-4 sm:gap-0">
          <Link to="/" className="flex items-center space-x-3">
            <Avatar className="h-10 w-10 sm:h-12 sm:w-12">
              <AvatarImage src="/lovable-uploads/a313fca3-1781-4832-a011-eb22c0d3b248.png" alt="Logo Barbearia do Gansinho" />
              <AvatarFallback>BG</AvatarFallback>
            </Avatar>
            <h1 className="text-lg sm:text-xl font-bold text-gray-900">Barbearia do Gansinho</h1>
          </Link>
          <div className="flex space-x-4">
            <Button variant="outline" size="sm" className="sm:size-default" asChild>
              <Link to="/meus-agendamentos">Meus Agendamentos</Link>
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              className="sm:size-default"
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

      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">Agende seu horário</h2>
          
          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="bg-white rounded-lg shadow-md p-6">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div>
                  <FormLabel>Nome completo</FormLabel>
                  <Input
                    {...form.register("nome")}
                    placeholder="Digite seu nome"
                    className="w-full"
                  />
                </div>

                <div>
                  <FormLabel>Telefone (WhatsApp)</FormLabel>
                  <Input
                    {...form.register("telefone")}
                    placeholder="Digite seu telefone"
                    className="w-full"
                  />
                </div>

                {/* Serviço */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                  {servicos.map((servico) => (
                    <Card
                      key={servico.id}
                      className={cn(
                        "cursor-pointer transition-all hover:scale-105",
                        servicoSelecionado === servico.nome
                          ? "border-2 border-primary"
                          : "border border-gray-200"
                      )}
                      onClick={() => setServicoSelecionado(servico.nome)}
                    >
                      <CardHeader>
                        <CardTitle className="text-lg">{servico.nome}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-gray-500">{servico.duracao} min</p>
                        <p className="font-semibold">R$ {servico.preco}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {/* Data */}
                <div className="mb-6">
                  <FormLabel>Data</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !dataSelecionada && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {dataSelecionada ? (
                          format(dataSelecionada, "PPP", { locale: ptBR })
                        ) : (
                          <span>Selecione uma data</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={dataSelecionada}
                        onSelect={setDataSelecionada}
                        disabled={(date) =>
                          date < new Date() || date > addMonths(new Date(), 2)
                        }
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                {/* Horário */}
                {servicoSelecionado && dataSelecionada && (
                  <div className="mb-6">
                    <FormLabel>Horário</FormLabel>
                    <div className="grid grid-cols-4 gap-2">
                      {horariosDisponiveis.map((horario) => (
                        <Button
                          key={horario}
                          type="button"
                          variant={horarioSelecionado === horario ? "default" : "outline"}
                          className="w-full"
                          onClick={() => {
                            console.log("Selecionando horário:", horario);
                            setHorarioSelecionado(horario);
                          }}
                        >
                          {horario}
                        </Button>
                      ))}
                    </div>
                    {horariosDisponiveis.length === 0 && (
                      <Alert className="mt-2">
                        <AlertDescription>
                          Não há horários disponíveis para este serviço nesta data.
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>
                )}

                <div className="flex justify-end pt-4">
                  <Button 
                    type="submit" 
                    size="lg"
                    variant="default"
                    disabled={loading || !form.getValues("nome") || !form.getValues("telefone") || !servicoSelecionado || !horarioSelecionado}
                  >
                    {loading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Processando...
                      </>
                    ) : (
                      "Confirmar agendamento"
                    )}
                  </Button>
                </div>
              </form>
            </Form>
          </div>
        </div>
      </main>

      <footer className="bg-white py-6">
        <div className="container mx-auto px-4">
          <div className="text-center text-sm text-gray-600">
            2023 Barbearia do Gansinho. Todos os direitos reservados.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Scheduling;
