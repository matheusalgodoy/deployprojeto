import { format, addMinutes, parse, isSameDay, isBefore, isAfter, isEqual } from 'date-fns';

export class HorariosService {
  private readonly INICIO_EXPEDIENTE = "09:00";
  private readonly FIM_EXPEDIENTE = "17:00";
  private readonly INTERVALO_MINUTOS = 30;

  getHorariosIniciais(): string[] {
    const horarios: string[] = [];
    let horarioAtual = parse(this.INICIO_EXPEDIENTE, "HH:mm", new Date());
    const horarioFim = parse(this.FIM_EXPEDIENTE, "HH:mm", new Date());

    while (isBefore(horarioAtual, horarioFim)) {
      horarios.push(format(horarioAtual, "HH:mm"));
      horarioAtual = addMinutes(horarioAtual, this.INTERVALO_MINUTOS);
    }

    return horarios;
  }

  getHorariosDisponiveis(data: Date, servico: string, agendamentos: any[]): string[] {
    // Encontrar a duração do serviço selecionado
    const servicoObj = servicos.find(s => s.nome === servico);
    if (!servicoObj) return [];
    
    const duracaoServico = servicoObj.duracao;
    console.log("Duração do serviço:", duracaoServico, "minutos");

    // Filtrar os agendamentos para a data selecionada
    const agendamentosData = agendamentos.filter(a => 
      a.data === format(data, "yyyy-MM-dd")
    );
    console.log("Agendamentos na data:", agendamentosData);

    // Criar uma timeline de minutos ocupados
    const timelineOcupada = new Set<number>();
    const inicioExpediente = parse(this.INICIO_EXPEDIENTE, "HH:mm", data).getTime();
    
    agendamentosData.forEach(agendamento => {
      const servicoAgendado = servicos.find(s => s.nome === agendamento.servico);
      if (servicoAgendado) {
        const inicio = parse(agendamento.horario, "HH:mm", data).getTime();
        const duracao = servicoAgendado.duracao;
        
        // Marcar cada minuto do serviço como ocupado
        for (let i = 0; i < duracao; i++) {
          const minuto = inicio + i * 60 * 1000;
          timelineOcupada.add(minuto);
        }
      }
    });

    // Gerar horários possíveis
    const horarios: string[] = [];
    let horarioAtual = parse(this.INICIO_EXPEDIENTE, "HH:mm", data);
    const horarioFim = parse(this.FIM_EXPEDIENTE, "HH:mm", data);

    while (isBefore(horarioAtual, horarioFim)) {
      const timestamp = horarioAtual.getTime();
      let disponivel = true;

      // Verificar se o horário já passou
      if (isSameDay(data, new Date()) && isBefore(horarioAtual, new Date())) {
        horarioAtual = addMinutes(horarioAtual, this.INTERVALO_MINUTOS);
        continue;
      }

      // Verificar se há espaço suficiente para o serviço
      for (let i = 0; i < duracaoServico; i++) {
        const minutoVerificar = timestamp + i * 60 * 1000;
        if (timelineOcupada.has(minutoVerificar)) {
          disponivel = false;
          break;
        }
      }

      // Verificar se o serviço terminaria após o horário de fechamento
      const horarioFimServico = addMinutes(horarioAtual, duracaoServico);
      if (isAfter(horarioFimServico, horarioFim)) {
        disponivel = false;
      }

      if (disponivel) {
        // Arredondar para o intervalo de 30 minutos mais próximo
        const minutos = horarioAtual.getHours() * 60 + horarioAtual.getMinutes();
        const minutosArredondados = Math.floor(minutos / 30) * 30;
        const horaArredondada = Math.floor(minutosArredondados / 60);
        const minutoArredondado = minutosArredondados % 60;
        
        const horarioFormatado = `${horaArredondada.toString().padStart(2, '0')}:${minutoArredondado.toString().padStart(2, '0')}`;
        if (!horarios.includes(horarioFormatado)) {
          horarios.push(horarioFormatado);
        }
      }

      horarioAtual = addMinutes(horarioAtual, this.INTERVALO_MINUTOS);
    }

    return horarios.sort();
  }
}

// Definição dos serviços e suas durações
export const servicos = [
  { id: 1, nome: "Corte de Cabelo", duracao: 30, preco: 35 },
  { id: 2, nome: "Barba", duracao: 20, preco: 25 },
  { id: 3, nome: "Corte + Barba", duracao: 50, preco: 55 },
  { id: 4, nome: "Acabamento", duracao: 15, preco: 20 },
];

export const horariosService = new HorariosService();
