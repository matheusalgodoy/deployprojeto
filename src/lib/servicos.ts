// Definição dos serviços disponíveis
export const servicos = [
  { id: 1, nome: "Corte de Cabelo", preco: 35, duracao: 30 },
  { id: 2, nome: "Barba", preco: 25, duracao: 20 },
  { id: 3, nome: "Corte + Barba", preco: 55, duracao: 50 },
  { id: 4, nome: "Acabamento", preco: 20, duracao: 15 },
] as const;

// Tipo para os serviços
export type Servico = typeof servicos[number];

// Função para obter a duração de um serviço pelo nome
export const getDuracaoServico = (nomeServico: string): number => {
  const servico = servicos.find(s => s.nome === nomeServico);
  return servico?.duracao || 30; // 30 minutos como padrão
};
