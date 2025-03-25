import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Formata um número de telefone para o formato internacional do WhatsApp
 * @param telefone Número de telefone (com ou sem formatação)
 * @returns Número formatado para WhatsApp (com código do país)
 */
export function formatarTelefoneWhatsApp(telefone: string): string {
  // Remove todos os caracteres não numéricos (espaços, parênteses, traços, etc)
  const numeroLimpo = telefone.replace(/\D/g, '');
  
  // Se o número já começar com 55 (código do Brasil), mantém como está
  if (numeroLimpo.startsWith('55') && numeroLimpo.length >= 12) {
    return numeroLimpo;
  }
  
  // Se o número começar com 0, remove o 0
  const numeroSemZeroInicial = numeroLimpo.startsWith('0') 
    ? numeroLimpo.substring(1) 
    : numeroLimpo;
  
  // Adiciona o código do Brasil (55) se não estiver presente
  return `55${numeroSemZeroInicial}`; // Retorna o número sem espaços ou caracteres especiais
}
