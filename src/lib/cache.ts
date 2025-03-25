// Cache para armazenar temporariamente os horários disponíveis e reduzir consultas ao banco

interface CacheItem<T> {
  data: T;
  timestamp: number;
  expiresIn: number; // tempo em milissegundos
}

class Cache {
  private cache: Map<string, CacheItem<any>> = new Map();
  
  // Adiciona ou atualiza um item no cache
  set<T>(key: string, data: T, expiresIn: number = 30000): void { // 30 segundos por padrão
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      expiresIn
    });
  }
  
  // Obtém um item do cache se estiver válido
  get<T>(key: string): T | null {
    const item = this.cache.get(key);
    
    if (!item) return null;
    
    // Verifica se o item expirou
    if (Date.now() > item.timestamp + item.expiresIn) {
      this.cache.delete(key);
      return null;
    }
    
    return item.data as T;
  }
  
  // Remove um item específico do cache
  remove(key: string): void {
    this.cache.delete(key);
  }
  
  // Remove todos os itens expirados do cache
  cleanup(): void {
    const now = Date.now();
    for (const [key, item] of this.cache.entries()) {
      if (now > item.timestamp + item.expiresIn) {
        this.cache.delete(key);
      }
    }
  }
  
  // Limpa todo o cache
  clear(): void {
    this.cache.clear();
  }
}

// Exporta uma instância única do cache para ser usada em toda a aplicação
export const cache = new Cache();