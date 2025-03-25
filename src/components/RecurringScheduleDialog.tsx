import { useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { recurringAgendamentoService } from "@/lib/recurring-agendamentos";

const diasSemana = [
  { id: 1, nome: "Segunda-feira" },
  { id: 2, nome: "Terça-feira" },
  { id: 3, nome: "Quarta-feira" },
  { id: 4, nome: "Quinta-feira" },
  { id: 5, nome: "Sexta-feira" },
  { id: 6, nome: "Sábado" },
];

const servicos = [
  { id: 1, nome: "Corte de Cabelo", preco: 35, duracao: 30 },
  { id: 2, nome: "Barba", preco: 25, duracao: 20 },
  { id: 3, nome: "Corte + Barba", preco: 55, duracao: 50 },
  { id: 4, nome: "Acabamento", preco: 20, duracao: 15 },
];

const horarios = [
  "09:00", "09:30", "10:00", "10:30", "11:00", "11:30", 
  "14:00", "14:30", "15:00", "15:30", "16:00", "16:30", "17:00"
];

const formSchema = z.object({
  nome: z.string().min(2, "O nome deve ter pelo menos 2 caracteres").max(100, "O nome não pode ter mais de 100 caracteres"),
  telefone: z.string()
    .min(10, "Telefone inválido")
    .max(15, "Telefone inválido")
    .regex(/^\(?[1-9]{2}\)? ?(?:[2-8]|9[1-9])[0-9]{3}\-?[0-9]{4}$/, "Formato de telefone inválido"),
  dia_semana: z.number({
    required_error: "Selecione um dia da semana",
  }).min(1, "Dia da semana inválido").max(6, "Dia da semana inválido"),
  horario: z.string({
    required_error: "Selecione um horário",
  }).refine((value) => horarios.includes(value), "Horário inválido"),
  servico: z.string({
    required_error: "Selecione um serviço",
  }).refine((value) => servicos.some(s => s.id.toString() === value), "Serviço inválido"),
});

type FormData = z.infer<typeof formSchema>;

interface RecurringScheduleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAgendamentoCreated: () => void;
}

export function RecurringScheduleDialog({ open, onOpenChange, onAgendamentoCreated }: RecurringScheduleDialogProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nome: "",
      telefone: "",
    },
  });

  const onSubmit = async (values: FormData) => {
    try {
      setLoading(true);
      const servico = servicos.find((s) => s.id.toString() === values.servico)?.nome;
      if (!servico) throw new Error("Serviço não encontrado");

      // Verificar disponibilidade
      const disponivel = await recurringAgendamentoService.verificarDisponibilidade(
        values.dia_semana,
        values.horario
      );

      if (!disponivel) {
        toast({
          title: "Horário indisponível",
          description: "Este horário já está reservado para outro cliente recorrente.",
          variant: "destructive"
        });
        setLoading(false);
        return;
      }

      // Criar agendamento recorrente
      await recurringAgendamentoService.criarAgendamento({
        nome: values.nome,
        telefone: values.telefone,
        servico,
        dia_semana: values.dia_semana,
        horario: values.horario,
        status: "ativo",
      });

      toast({
        title: "Agendamento recorrente criado",
        description: "O horário foi reservado com sucesso!",
      });

      onAgendamentoCreated();
      onOpenChange(false);
      form.reset();
    } catch (error) {
      console.error("Erro ao criar agendamento recorrente:", error);
      toast({
        title: "Erro",
        description: "Não foi possível criar o agendamento recorrente.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Novo Agendamento Recorrente</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="nome"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome do cliente</FormLabel>
                  <FormControl>
                    <Input placeholder="Nome do cliente" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="telefone"
              render={({ field }) => (
                <FormItem className="mb-4">
                  <FormLabel>Telefone</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="(00) 00000-0000" 
                      {...field} 
                      onChange={(e) => {
                        // Filtra apenas números - remove todos os caracteres não numéricos
                        const numeroLimpo = e.target.value.replace(/\D/g, '');
                        field.onChange(numeroLimpo);
                      }}
                      value={field.value}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="dia_semana"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Dia da semana</FormLabel>
                  <Select onValueChange={(value) => field.onChange(Number(value))} value={field.value?.toString()}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um dia da semana" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {diasSemana.map((dia) => (
                        <SelectItem key={dia.id} value={dia.id.toString()}>
                          {dia.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="horario"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Horário</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um horário" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {horarios.map((horario) => (
                        <SelectItem key={horario} value={horario}>
                          {horario}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="servico"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Serviço</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um serviço" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {servicos.map((servico) => (
                        <SelectItem key={servico.id} value={servico.id.toString()}>
                          {servico.nome} - R$ {servico.preco}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Criando agendamento..." : "Criar Agendamento"}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}