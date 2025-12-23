/**
 * SERVICIO: Utilidades de Fecha
 * 
 * Contiene funciones para trabajar con fechas de nacimiento
 * y cálculos relacionados
 */

/**
 * Calcula la edad en años basada en fecha de nacimiento
 * 
 * @param birthDate - Fecha de nacimiento (Date o string ISO)
 * @returns Edad en años (entero)
 * 
 * @example
 * calculateAge('1997-05-15') // Devuelve edad actual
 * calculateAge(new Date('1997-05-15')) // Devuelve edad actual
 */
export const calculateAge = (birthDate: Date | string | null | undefined): number => {
  if (!birthDate) return 0;
  // Convertir a Date si es string
  const birth = typeof birthDate === 'string' ? new Date(birthDate) : birthDate;

  // Obtener fecha actual
  const today = new Date();

  // Calcular diferencia de años
  let age = today.getFullYear() - birth.getFullYear();

  // Ajustar si el cumpleaños no ha ocurrido este año
  const monthDifference = today.getMonth() - birth.getMonth();
  if (monthDifference < 0 || (monthDifference === 0 && today.getDate() < birth.getDate())) {
    age--;
  }

  return age;
};

/**
 * Formatea una fecha de nacimiento para mostrarla al usuario
 * 
 * @param birthDate - Fecha de nacimiento
 * @returns String formateado (ej: "15 de mayo de 1997")
 */
export const formatBirthDate = (birthDate: Date | string): string => {
  const date = typeof birthDate === 'string' ? new Date(birthDate) : birthDate;

  const options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  };

  return new Intl.DateTimeFormat('es-CL', options).format(date);
};

/**
 * Valida si una fecha de nacimiento es válida
 * Verifica que:
 * - Sea una fecha válida
 * - No sea en el futuro
 * - No sea anterior a 1900
 * 
 * @param birthDate - Fecha a validar (string formato YYYY-MM-DD)
 * @returns true si es válida, false si no
 */
export const isValidBirthDate = (birthDate: string): boolean => {
  // Validar formato YYYY-MM-DD
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(birthDate)) {
    return false;
  }

  const date = new Date(birthDate);
  const now = new Date();

  // Debe ser una fecha válida
  if (isNaN(date.getTime())) {
    return false;
  }

  // No puede ser en el futuro
  if (date > now) {
    return false;
  }

  // No puede ser anterior a 1900
  if (date.getFullYear() < 1900) {
    return false;
  }

  return true;
};
