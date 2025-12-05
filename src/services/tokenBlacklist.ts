/**
 * SERVICIO: Token Blacklist
 * 
 * Gestiona una lista de tokens invalidados (logout)
 * En producción, esto debería estar en Redis o una BD
 */

// Conjunto en memoria para almacenar tokens invalidados
const tokenBlacklist = new Set<string>();

/**
 * Agregar token a la blacklist (cuando el usuario hace logout)
 */
export function addTokenToBlacklist(token: string): void {
  tokenBlacklist.add(token);
  
  // En producción, aquí guardarías en Redis con TTL igual a la expiración del token
  console.log(`Token agregado a blacklist. Total tokens en blacklist: ${tokenBlacklist.size}`);
}

/**
 * Verificar si un token está en la blacklist
 */
export function isTokenBlacklisted(token: string): boolean {
  return tokenBlacklist.has(token);
}

/**
 * Limpiar la blacklist (útil para testing o mantenimiento)
 */
export function clearBlacklist(): void {
  tokenBlacklist.clear();
  console.log('Blacklist de tokens limpiada');
}

/**
 * Obtener cantidad de tokens en blacklist
 */
export function getBlacklistSize(): number {
  return tokenBlacklist.size;
}
