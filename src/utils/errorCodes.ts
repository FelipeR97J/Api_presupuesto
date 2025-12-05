/**
 * CÓDIGOS DE ERROR PERSONALIZADOS
 * 
 * Sistema de códigos únicos para identificar errores específicos
 * Facilita el debugging y manejo de errores en el cliente
 */

export const ErrorCodes = {
  // Autenticación
  AUTH: {
    TOKEN_INVALID: 'AUTH_001', // Token inválido o expirado
    TOKEN_MISSING: 'AUTH_002', // No se proporcionó token
    TOKEN_EXPIRED: 'AUTH_003', // Token expirado
    INVALID_CREDENTIALS: 'AUTH_004', // Email o contraseña incorrectos
    USER_NOT_FOUND: 'AUTH_005', // Usuario no encontrado
    USER_DELETED: 'AUTH_006', // Usuario eliminado (soft delete)
    ADMIN_REQUIRED: 'AUTH_007', // Requiere permisos de administrador
  },

  // Registro
  REGISTER: {
    EMAIL_REQUIRED: 'REG_001',
    PASSWORD_REQUIRED: 'REG_002',
    FIRSTNAME_REQUIRED: 'REG_003',
    PATERNAL_LASTNAME_REQUIRED: 'REG_004',
    RUT_REQUIRED: 'REG_005',
    BIRTHDATE_REQUIRED: 'REG_006',
    INVALID_RUT: 'REG_007',
    INVALID_BIRTHDATE: 'REG_008',
    EMAIL_ALREADY_REGISTERED: 'REG_009',
    RUT_ALREADY_REGISTERED: 'REG_010',
  },

  // Actualización de perfil
  PROFILE: {
    NO_FIELDS_TO_UPDATE: 'PRF_001',
    EMAIL_ALREADY_REGISTERED: 'PRF_002',
    INVALID_BIRTHDATE: 'PRF_003',
    RUT_CANNOT_BE_MODIFIED: 'PRF_004',
  },

  // Ingresos
  INCOME: {
    AMOUNT_REQUIRED: 'INC_001',
    CATEGORY_REQUIRED: 'INC_002',
    CATEGORY_NOT_FOUND: 'INC_003',
    CATEGORY_INACTIVE: 'INC_004',
    INCOME_NOT_FOUND: 'INC_005',
    INVALID_DATE_FORMAT: 'INC_006',
  },

  // Gastos
  EXPENSE: {
    AMOUNT_REQUIRED: 'EXP_001',
    CATEGORY_REQUIRED: 'EXP_002',
    CATEGORY_NOT_FOUND: 'EXP_003',
    CATEGORY_INACTIVE: 'EXP_004',
    EXPENSE_NOT_FOUND: 'EXP_005',
    INVALID_DATE_FORMAT: 'EXP_006',
  },

  // Categorías de Ingresos
  INCOME_CATEGORY: {
    NAME_REQUIRED: 'INC_CAT_001',
    CATEGORY_NOT_FOUND: 'INC_CAT_002',
    DUPLICATE_NAME: 'INC_CAT_003',
    SYSTEM_CATEGORY_CANNOT_MODIFY: 'INC_CAT_004',
    PERMISSION_DENIED: 'INC_CAT_005',
    CANNOT_DELETE_WITH_INCOMES: 'INC_CAT_006',
    CANNOT_DEACTIVATE_WITH_INCOMES: 'INC_CAT_007',
  },

  // Categorías de Gastos
  EXPENSE_CATEGORY: {
    NAME_REQUIRED: 'EXP_CAT_001',
    CATEGORY_NOT_FOUND: 'EXP_CAT_002',
    DUPLICATE_NAME: 'EXP_CAT_003',
    SYSTEM_CATEGORY_CANNOT_MODIFY: 'EXP_CAT_004',
    PERMISSION_DENIED: 'EXP_CAT_005',
    CANNOT_DELETE_WITH_EXPENSES: 'EXP_CAT_006',
    CANNOT_DEACTIVATE_WITH_EXPENSES: 'EXP_CAT_007',
  },

  // General
  SERVER_ERROR: 'SRV_001',
};

/**
 * Mensajes de error asociados a cada código
 */
export const ErrorMessages: Record<string, string> = {
  // Autenticación
  AUTH_001: 'Token inválido o no autorizado',
  AUTH_002: 'Token no proporcionado en Authorization header',
  AUTH_003: 'Token expirado. Por favor, inicia sesión nuevamente',
  AUTH_004: 'Email o contraseña incorrectos',
  AUTH_005: 'Usuario no encontrado',
  AUTH_006: 'Esta cuenta ha sido eliminada',
  AUTH_007: 'Acceso denegado. Se requieren permisos de administrador',

  // Registro
  REG_001: 'El email es requerido',
  REG_002: 'La contraseña es requerida',
  REG_003: 'El nombre es requerido',
  REG_004: 'El apellido paterno es requerido',
  REG_005: 'El RUT es requerido',
  REG_006: 'La fecha de nacimiento es requerida',
  REG_007: 'RUT chileno inválido. Formato: XX.XXX.XXX-K (ej: 30.123.456-K)',
  REG_008: 'Fecha de nacimiento inválida. Formato: YYYY-MM-DD. Debe ser una fecha pasada',
  REG_009: 'Este email ya está registrado',
  REG_010: 'Este RUT ya está registrado',

  // Perfil
  PRF_001: 'No hay campos para actualizar',
  PRF_002: 'Este email ya está registrado',
  PRF_003: 'Fecha de nacimiento inválida. Formato: YYYY-MM-DD. Debe ser una fecha pasada',
  PRF_004: 'El RUT no puede ser modificado (es inmutable)',

  // Ingresos
  INC_001: 'El monto es requerido',
  INC_002: 'El ID de la categoría es requerido',
  INC_003: 'Categoría no encontrada',
  INC_004: 'La categoría está inactiva y no puede recibir nuevos ingresos',
  INC_005: 'Ingreso no encontrado',
  INC_006: 'Formato de fecha inválido. Use YYYY-MM-DD',

  // Gastos
  EXP_001: 'El monto es requerido',
  EXP_002: 'El ID de la categoría es requerido',
  EXP_003: 'Categoría no encontrada',
  EXP_004: 'La categoría está inactiva y no puede recibir nuevos gastos',
  EXP_005: 'Gasto no encontrado',
  EXP_006: 'Formato de fecha inválido. Use YYYY-MM-DD',

  // Categorías de Ingresos
  INC_CAT_001: 'El nombre de la categoría es requerido',
  INC_CAT_002: 'Categoría de ingreso no encontrada',
  INC_CAT_003: 'Ya existe una categoría con este nombre',
  INC_CAT_004: 'No se pueden modificar las categorías del sistema',
  INC_CAT_005: 'Permisos insuficientes. Solo puedes modificar tus propias categorías',
  INC_CAT_006: 'No se puede eliminar la categoría. Tiene ingresos activos asociados. Reasigna o elimina los ingresos primero',
  INC_CAT_007: 'No se puede desactivar la categoría. Tiene ingresos activos asociados. Reasigna o elimina los ingresos primero',

  // Categorías de Gastos
  EXP_CAT_001: 'El nombre de la categoría es requerido',
  EXP_CAT_002: 'Categoría de gasto no encontrada',
  EXP_CAT_003: 'Ya existe una categoría con este nombre',
  EXP_CAT_004: 'No se pueden modificar las categorías del sistema',
  EXP_CAT_005: 'Permisos insuficientes. Solo puedes modificar tus propias categorías',
  EXP_CAT_006: 'No se puede eliminar la categoría. Tiene gastos activos asociados. Reasigna o elimina los gastos primero',
  EXP_CAT_007: 'No se puede desactivar la categoría. Tiene gastos activos asociados. Reasigna o elimina los gastos primero',

  // General
  SRV_001: 'Error interno del servidor',
};

/**
 * Función auxiliar para retornar error formateado
 */
export const formatError = (code: string, customMessage?: string) => {
  return {
    code,
    error: customMessage || ErrorMessages[code] || 'Error desconocido',
  };
};
