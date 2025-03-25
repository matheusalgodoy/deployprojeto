import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { BARBEIRO_CREDENCIAIS } from "./constants";

// Função para formatar o número de telefone para o formato internacional
function formatPhoneNumber(phone: string) {
  // Remove todos os caracteres não numéricos
  const numbers = phone.replace(/\D/g, '');
  
  // Se começar com 0, remove o 0
  const withoutLeadingZero = numbers.replace(/^0+/, '');
  
  // Adiciona o código do país (Brasil: 55) se não existir
  if (!withoutLeadingZero.startsWith('55')) {
    return `55${withoutLeadingZero}`;
  }
  
  return withoutLeadingZero;
}

export const notificationService = {
  async enviarNotificacaoCancelamento(agendamento: {
    nome: string;
    servico: string;
    data: Date;
    horario: string;
  }) {
    try {
      const telefone = formatPhoneNumber(BARBEIRO_CREDENCIAIS.telefone);
      const dataFormatada = format(agendamento.data, "dd 'de' MMMM", { locale: ptBR });
      
      // Monta a mensagem
      const mensagem = `Olá! O cliente ${agendamento.nome} cancelou o agendamento:\n\n` +
        `Serviço: ${agendamento.servico}\n` +
        `Data: ${dataFormatada}\n` +
        `Horário: ${agendamento.horario}`;

      // Codifica a mensagem para URL
      const mensagemCodificada = encodeURIComponent(mensagem);

      // Cria o link do WhatsApp
      const whatsappUrl = `https://wa.me/${telefone}?text=${mensagemCodificada}`;

      // Abre o WhatsApp em uma nova aba
      window.open(whatsappUrl, '_blank');

      return true;
    } catch (error) {
      console.error('Erro ao enviar notificação:', error);
      return false;
    }
  }
};
