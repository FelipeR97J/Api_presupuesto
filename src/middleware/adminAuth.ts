import { Request, Response, NextFunction } from 'express';
import { User } from '../entityDB/mysql/user';

/**
 * Interfaz extendida de Request con datos del usuario autenticado
 * Incluye el ID del usuario, email y rol
 */
export interface AuthRequest extends Request {
  user?: {
    id: number;
    email: string;
    role: 'admin' | 'user';
  };
}

/**
 * MIDDLEWARE: Verificar que el usuario sea ADMIN
 * 
 * Uso:
 * - router.delete('/endpoint', adminMiddleware, (req, res) => {...})
 * 
 * Validaciones:
 * 1. Token JWT válido
 * 2. Usuario existe y no está eliminado
 * 3. Usuario tiene rol = 'admin'
 * 
 * Errores posibles:
 * - 401: Token no válido o no autenticado
 * - 403: Usuario no es admin
 */
export async function adminMiddleware(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    // Verificar que el usuario esté autenticado
    if (!req.user) {
      res.status(401).json({
        code: 'AUTH_002',
        error: 'Token no proporcionado. Requiere autenticación como admin.',
      });
      return;
    }

    // Verificar que el usuario tenga rol admin
    if (req.user.role !== 'admin') {
      res.status(403).json({
        code: 'AUTH_007',
        error: 'Acceso denegado',
        message: 'Se requieren permisos de administrador para esta acción',
      });
      return;
    }

    // Verificar que el usuario aún exista y no esté eliminado
    const user = await User.findByPk(req.user.id);
    if (!user) {
      res.status(401).json({
        code: 'AUTH_006',
        error: 'Esta cuenta ha sido eliminada',
      });
      return;
    }

    // Verificar que la cuenta esté activa
    if ((user as any).id_estado === 2) {
      res.status(403).json({
        code: 'AUTH_001',
        error: 'La cuenta está suspendida. Contacte con soporte.',
      });
      return;
    }

    next();
  } catch (error) {
    res.status(500).json({
      code: 'SRV_001',
      error: 'Error verificando permisos de administrador',
    });
  }
}

/**
 * FUNCIÓN: Verificar si el usuario es admin
 * 
 * Uso en lógica interna:
 * if (isAdmin(user.role)) { ... }
 * 
 * @param role - Rol del usuario ('admin' o 'user')
 * @returns true si es admin, false en caso contrario
 */
export function isAdmin(role: string | undefined): boolean {
  return role === 'admin';
}

/**
 * FUNCIÓN: Verificar si el usuario es admin o propietario del recurso
 * 
 * Uso:
 * if (isAdminOrOwner(req.user, resourceUserId)) { ... }
 * 
 * @param user - Usuario autenticado
 * @param resourceUserId - ID del propietario del recurso
 * @returns true si es admin o propietario
 */
export function isAdminOrOwner(
  user: { id: number; role: string } | undefined,
  resourceUserId: number
): boolean {
  if (!user) return false;
  return isAdmin(user.role) || user.id === resourceUserId;
}
