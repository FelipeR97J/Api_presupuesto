import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { isTokenBlacklisted } from '../services/tokenBlacklist';
import { ErrorCodes, formatError } from '../utils/errorCodes';
import { User } from '../entityDB/mysql/user';
import { getSimplifiedUserRole } from '../services/roleService';

/**
 * MIDDLEWARE: Autenticación JWT
 * 
 * Verifica que el usuario tenga un token JWT válido
 * Se ejecuta en rutas protegidas para verificar que el usuario está autenticado
 * También valida que:
 * - El usuario no esté eliminado (soft delete)
 * - El usuario esté activo (isActive = true)
 */

const JWT_SECRET = 'tu_secreto_super_seguro'; // En producción: variable de entorno

/**
 * Interfaz extendida de Request para incluir datos del usuario autenticado
 */
export interface AuthRequest extends Request {
  user?: {
    id: number;
    email: string;
    role: 'admin' | 'user';
  };
}

/**
 * Middleware para verificar JWT
 * - Extrae el token del header Authorization
 * - Valida el token
 * - Verifica que el token no esté en la blacklist (no haya hecho logout)
 * - Valida que el usuario no esté eliminado (paranoid soft delete)
 * - Valida que el usuario esté activo (isActive = true)
 * - Agrega los datos del usuario a la request
 */
export const authMiddleware = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    // Obtener el token del header: "Bearer token_aqui"
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      return res.status(401).json(formatError(ErrorCodes.AUTH.TOKEN_MISSING));
    }

    // Verificar si el token está en la blacklist (usuario hizo logout)
    if (isTokenBlacklisted(token)) {
      return res.status(401).json(formatError(ErrorCodes.AUTH.TOKEN_EXPIRED));
    }

    // Verificar y decodificar el token
    const decoded = jwt.verify(token, JWT_SECRET) as { id: number; email: string };
    
    // Validar que el usuario existe y no está eliminado
    const user = await User.findByPk(decoded.id, {
      paranoid: false, // Incluir usuarios eliminados para validarlos
    });

    if (!user) {
      return res.status(401).json(formatError(ErrorCodes.AUTH.USER_NOT_FOUND));
    }

    // Validar que el usuario no esté eliminado (soft delete)
    // Si deletedAt tiene valor, está eliminado.
    if (user.get('deletedAt')) {
      return res.status(401).json(formatError(ErrorCodes.AUTH.USER_DELETED));
    }

    // Validar que el usuario esté activo
    if (user.get('id_estado') === 2) {
      return res.status(403).json(formatError(
        ErrorCodes.AUTH.TOKEN_INVALID,
        'Account is suspended. Contact support.'
      ));
    }
    
    // Agregar los datos del usuario a la request (incluir rol desde user_roles)
    const userRole = await getSimplifiedUserRole(decoded.id);
    
    req.user = {
      id: decoded.id,
      email: decoded.email,
      role: userRole as 'admin' | 'user',
    };
    
    next();
  } catch (error: any) {
    // Diferenciar entre token expirado e inválido
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json(formatError(ErrorCodes.AUTH.TOKEN_EXPIRED));
    }
    return res.status(401).json(formatError(ErrorCodes.AUTH.TOKEN_INVALID));
  }
};

/**
 * Generar token JWT
 * @param userId ID del usuario
 * @param email Email del usuario
 * @returns Token JWT válido por 7 días
 */
export const generateToken = (userId: number, email: string): string => {
  return jwt.sign(
    { id: userId, email },
    JWT_SECRET,
    { expiresIn: '7d' } // El token expira en 7 días
  );
};
