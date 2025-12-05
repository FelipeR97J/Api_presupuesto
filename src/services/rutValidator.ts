/**
 * SERVICIO: Validación de RUT Chileno
 * 
 * Funciones para validar y calcular el dígito verificador del RUT
 * Formato: XX.XXX.XXX-K (ej: 12.345.678-9)
 */

/**
 * Limpiar RUT: elimina puntos, guiones y espacios
 * @param rut RUT con formato o sin formato
 * @returns RUT limpio solo con números y dígito verificador
 */
function cleanRUT(rut: string): string {
  return rut.toUpperCase().replace(/[.\-\s]/g, '');
}

/**
 * Calcular dígito verificador del RUT
 * Algoritmo: Multiplicar cada dígito por 2,3,4,5,6,7 (repitiendo)
 * Sumar todos los resultados, restar de múltiplo de 11 más cercano
 * 
 * @param rutNumbers RUT sin dígito verificador (ej: "12345678")
 * @returns Dígito verificador (0-9 o K)
 */
function calculateVerifierDigit(rutNumbers: string): string {
  const multipliers = [2, 3, 4, 5, 6, 7];
  let sum = 0;
  let multiplierIndex = 0;

  // Recorrer de derecha a izquierda
  for (let i = rutNumbers.length - 1; i >= 0; i--) {
    const digit = parseInt(rutNumbers[i], 10);
    sum += digit * multipliers[multiplierIndex % 6];
    multiplierIndex++;
  }

  // Calcular el dígito verificador
  const remainder = sum % 11;
  const verifier = 11 - remainder;

  if (verifier === 11) return "0";
  if (verifier === 10) return "K";
  return verifier.toString();
}

/**
 * Validar RUT chileno
 * Verifica el formato y que el dígito verificador sea correcto
 * 
 * @param rut RUT a validar (con o sin formato)
 * @returns true si es válido, false si no
 */
export function isValidRUT(rut: string): boolean {
  if (!rut || typeof rut !== "string") {
    return false;
  }

  const cleanedRUT = cleanRUT(rut);

  // Debe tener al menos 8 caracteres (7 dígitos + 1 verificador)
  if (cleanedRUT.length < 8) {
    return false;
  }

  // El penúltimo carácter debe ser "-" en la versión formateada
  // Los primeros caracteres deben ser dígitos
  const rutNumbers = cleanedRUT.slice(0, -1);
  const providedVerifier = cleanedRUT.slice(-1);

  // Validar que rutNumbers sean solo dígitos
  if (!/^\d+$/.test(rutNumbers)) {
    return false;
  }

  // Calcular el dígito verificador correcto
  const correctVerifier = calculateVerifierDigit(rutNumbers);

  // Comparar con el proporcionado
  return providedVerifier === correctVerifier;
}

/**
 * Formatear RUT con puntos y guión
 * Convierte "123456789" a "12.345.678-9"
 * 
 * @param rut RUT sin formato
 * @returns RUT formateado
 */
export function formatRUT(rut: string): string {
  const cleanedRUT = cleanRUT(rut);

  if (cleanedRUT.length < 8) {
    return cleanedRUT; // Retornar como está si es muy corto
  }

  // Separar el dígito verificador
  const rutNumbers = cleanedRUT.slice(0, -1);
  const verifier = cleanedRUT.slice(-1);

  // Formatear: XX.XXX.XXX-K
  return `${rutNumbers.slice(0, -6)}.${rutNumbers.slice(-6, -3)}.${rutNumbers.slice(-3)}-${verifier}`;
}

/**
 * Obtener información del RUT
 * @param rut RUT a analizar
 * @returns Objeto con información del RUT o null si es inválido
 */
export function getRUTInfo(rut: string): { isValid: boolean; formatted: string; clean: string } | null {
  if (!isValidRUT(rut)) {
    return null;
  }

  const cleanedRUT = cleanRUT(rut);
  return {
    isValid: true,
    formatted: formatRUT(cleanedRUT),
    clean: cleanedRUT,
  };
}
