import express from 'express';
import { User } from '../entityDB/mysql/user';
import { Role } from '../entityDB/mysql/role';
import bcryptjs from 'bcryptjs';
import { generateToken, authMiddleware, AuthRequest } from '../middleware/auth';
import { addTokenToBlacklist } from '../services/tokenBlacklist';
import { isValidRUT, formatRUT } from '../services/rutValidator';
import { isValidBirthDate, calculateAge } from '../services/dateUtils';
import { ErrorCodes, formatError } from '../utils/errorCodes';

const router = express.Router();

/**
 * REGISTRO DE NUEVO USUARIO
 * POST /auth/register
 * 
 * Crea una nueva cuenta de usuario y asigna rol
 * Body: { email: string, password: string, firstName: string, paternalLastName: string, maternalLastName?: string, rut: string, birthDate: string, id_rol: number }
 */
router.post('/register', async (req, res) => {
  try {
    const { email, password, firstName, paternalLastName, maternalLastName, rut, birthDate, id_rol, id_estado } = req.body;

    // Validar datos requeridos
    if (!email || !password || !firstName || !paternalLastName || !rut || !birthDate) {
      return res.status(400).json(formatError(
        ErrorCodes.REGISTER.EMAIL_REQUIRED,
        'Email, password, firstName, paternalLastName, RUT, birthDate, and id_rol are required'
      ));
    }

    // Validar que id_rol esté presente
    if (!id_rol) {
      return res.status(400).json({ error: 'id_rol es requerido' });
    }

    // Validar que el rol existe
    const role = await Role.findByPk(id_rol);
    if (!role) {
      return res.status(404).json({ error: `Rol con ID ${id_rol} no encontrado` });
    }

    // Validar id_estado si se proporciona (debe ser 1 o 2)
    if (id_estado && (id_estado !== 1 && id_estado !== 2)) {
      return res.status(400).json({ error: 'id_estado debe ser 1 (Activo) o 2 (Inactivo)' });
    }

    // Validar RUT chileno
    if (!isValidRUT(rut)) {
      return res.status(400).json(formatError(ErrorCodes.REGISTER.INVALID_RUT));
    }

    // Validar fecha de nacimiento
    if (!isValidBirthDate(birthDate)) {
      return res.status(400).json(formatError(ErrorCodes.REGISTER.INVALID_BIRTHDATE));
    }

    // Verificar si el usuario ya existe por email
    const existingUserByEmail = await User.findOne({ where: { email } });
    if (existingUserByEmail) {
      return res.status(400).json(formatError(ErrorCodes.REGISTER.EMAIL_ALREADY_REGISTERED));
    }

    // Verificar si el RUT ya existe
    const existingUserByRUT = await User.findOne({ where: { rut: formatRUT(rut) } });
    if (existingUserByRUT) {
      return res.status(400).json(formatError(ErrorCodes.REGISTER.RUT_ALREADY_REGISTERED));
    }

    // Encriptar la contraseña con bcryptjs
    // Rondas de cifrado: 10 (más alto = más seguro pero más lento)
    const salt = await bcryptjs.genSalt(10);
    const hashedPassword = await bcryptjs.hash(password, salt);

    // Crear nuevo usuario con RUT formateado y rol asignado directamente
    const newUser = await User.create({
      email,
      password: hashedPassword,
      firstName,
      paternalLastName,
      maternalLastName: maternalLastName || '',
      rut: formatRUT(rut),
      birthDate: new Date(birthDate),
      id_rol: id_rol,
      id_estado: id_estado || 1, // 1 = Activo (por defecto)
    });

    // Generar token JWT
    const token = generateToken((newUser as any).id, email);

    // Calcular la edad actual
    const age = calculateAge(birthDate);

    // Obtener el estado del usuario
    const { Estado } = require('../entityDB/mysql/estado');
    const estado = await Estado.findByPk((newUser as any).id_estado);

    res.status(201).json({
      message: 'Usuario registrado correctamente',
      token,
      user: {
        id: (newUser as any).id,
        email: newUser.get('email'),
        firstName: newUser.get('firstName'),
        paternalLastName: newUser.get('paternalLastName'),
        maternalLastName: newUser.get('maternalLastName'),
        rut: newUser.get('rut'),
        id_rol: id_rol,
        role: (role as any).name,
        id_estado: (newUser as any).id_estado,
        estado: estado ? (estado as any).description : 'Activo',
        age,
      },
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ error: 'Error registering user' });
  }
});

/**
 * LOGIN DE USUARIO
 * POST /auth/login
 * 
 * Autentica un usuario y devuelve un token JWT
 * Body: { email: string, password: string }
 */
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validar datos requeridos
    if (!email || !password) {
      return res.status(400).json(formatError(
        ErrorCodes.REGISTER.EMAIL_REQUIRED,
        'Email and password are required'
      ));
    }

    // Buscar el usuario por email (paranoid: true excluye automáticamente usuarios eliminados)
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(401).json(formatError(ErrorCodes.AUTH.INVALID_CREDENTIALS));
    }

    // Comparar la contraseña con la encriptada
    const isPasswordValid = await bcryptjs.compare(
      password,
      user.get('password') as string
    );
    if (!isPasswordValid) {
      return res.status(401).json(formatError(ErrorCodes.AUTH.INVALID_CREDENTIALS));
    }

    // Validar que el usuario esté activo (id_estado = 1 es Activo, 2 es Inactivo)
    if ((user as any).id_estado === 2) {
      return res.status(403).json({
        code: 'AUTH_008',
        error: 'Cuenta suspendida',
        message: 'Su cuenta ha sido desactivada. Contacte con el administrador.',
      });
    }

    // Generar token JWT
    const token = generateToken((user as any).id, user.get('email') as string);

    // Obtener rol del usuario desde el campo id_rol de la tabla users
    let roleData = null;
    if (user.get('id_rol')) {
      const role = await Role.findByPk(user.get('id_rol') as number);
      roleData = role ? { id: (role as any).id, name: (role as any).name } : null;
    }

    // Actualizar lastLoginAt
    await user.update({ lastLoginAt: new Date() });

    // Obtener el estado del usuario
    const { Estado } = require('../entityDB/mysql/estado');
    const estado = await Estado.findByPk((user as any).id_estado);

    res.status(200).json({
      message: 'Login successful',
      token,
      user: {
        id: (user as any).id,
        email: user.get('email'),
        firstName: user.get('firstName'),
        id_rol: user.get('id_rol'),
        role: roleData?.name || null,
        id_estado: (user as any).id_estado,
        estado: estado ? (estado as any).description : 'Activo',
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Error logging in' });
  }
});

/**
 * OBTENER PERFIL DEL USUARIO ACTUAL
 * GET /auth/profile
 * 
 * Requiere autenticación (token JWT válido)
 * Devuelve los datos del usuario autenticado
 */
router.get('/profile', authMiddleware, async (req: AuthRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json(formatError(ErrorCodes.AUTH.TOKEN_INVALID));
    }

    // Buscar el usuario autenticado
    const user = await User.findByPk(req.user.id, {
      attributes: { exclude: ['password'] }, // Excluir la contraseña
    });

    if (!user) {
      return res.status(401).json(formatError(ErrorCodes.AUTH.USER_NOT_FOUND));
    }

    res.status(200).json({
      id: (user as any).id,
      email: user.get('email'),
      firstName: user.get('firstName'),
      paternalLastName: user.get('paternalLastName'),
      maternalLastName: user.get('maternalLastName'),
      phoneNumber: user.get('phoneNumber'),
      birthDate: user.get('birthDate'),
      age: calculateAge(user.get('birthDate') as Date),
      rut: user.get('rut'),
      id_rol: user.get('id_rol'),
      role: req.user?.role,
      id_estado: (user as any).id_estado,
      estado: (user as any).id_estado === 1 ? 'Activo' : 'Inactivo',
      lastLoginAt: user.get('lastLoginAt'),
      createdAt: user.get('createdAt'),
      updatedAt: user.get('updatedAt'),
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json(formatError(ErrorCodes.SERVER_ERROR));
  }
});

/**
 * ACTUALIZAR PERFIL DEL USUARIO
 * PATCH /auth/profile
 * 
 * Permite actualizar los datos del usuario autenticado
 * Campos actualizables: firstName, paternalLastName, maternalLastName, email, birthDate
 * Validaciones:
 * - Email debe ser único (si se intenta cambiar)
 * - RUT es inmutable (no se puede cambiar)
 * - BirthDate debe ser válida (fecha pasada)
 */
router.patch('/profile', authMiddleware, async (req: AuthRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json(formatError(ErrorCodes.AUTH.TOKEN_INVALID));
    }

    const { firstName, paternalLastName, maternalLastName, email, birthDate, phoneNumber } = req.body;

    // Buscar el usuario actual
    const user = await User.findByPk(req.user.id);
    if (!user) {
      return res.status(401).json(formatError(ErrorCodes.AUTH.USER_NOT_FOUND));
    }

    // Validar si se intenta cambiar el email y verificar que sea único
    if (email && email !== user.get('email')) {
      const existingEmailUser = await User.findOne({ where: { email } });
      if (existingEmailUser) {
        return res.status(400).json(formatError(ErrorCodes.PROFILE.EMAIL_ALREADY_REGISTERED));
      }
    }

    // Validar fecha de nacimiento si se proporciona
    if (birthDate !== undefined) {
      if (!isValidBirthDate(birthDate)) {
        return res.status(400).json(formatError(ErrorCodes.PROFILE.INVALID_BIRTHDATE));
      }
    }

    // Validar teléfono si se proporciona
    if (phoneNumber !== undefined && phoneNumber !== null) {
      if (phoneNumber.length < 7 || phoneNumber.length > 20) {
        return res.status(400).json(formatError(
          ErrorCodes.PROFILE.INVALID_BIRTHDATE,
          'Phone number must be between 7 and 20 characters'
        ));
      }
    }

    // Actualizar solo los campos permitidos
    const updateData: any = {};
    if (firstName !== undefined) updateData.firstName = firstName;
    if (paternalLastName !== undefined) updateData.paternalLastName = paternalLastName;
    if (maternalLastName !== undefined) updateData.maternalLastName = maternalLastName;
    if (email !== undefined) updateData.email = email;
    if (birthDate !== undefined) updateData.birthDate = new Date(birthDate);
    if (phoneNumber !== undefined) updateData.phoneNumber = phoneNumber;

    // Si no hay nada que actualizar
    if (Object.keys(updateData).length === 0) {
      return res.status(400).json(formatError(ErrorCodes.PROFILE.NO_FIELDS_TO_UPDATE));
    }

    // Actualizar el usuario
    await user.update(updateData);

    // Retornar datos actualizados (sin contraseña)
    res.status(200).json({
      message: 'Profile updated successfully',
      user: {
        id: (user as any).id,
        email: user.get('email'),
        firstName: user.get('firstName'),
        paternalLastName: user.get('paternalLastName'),
        maternalLastName: user.get('maternalLastName'),
        phoneNumber: user.get('phoneNumber'),
        birthDate: user.get('birthDate'),
        age: calculateAge(user.get('birthDate') as Date),
        rut: user.get('rut'),
        id_estado: (user as any).id_estado,
        estado: (user as any).id_estado === 1 ? 'Activo' : 'Inactivo',
        lastLoginAt: user.get('lastLoginAt'),
        createdAt: user.get('createdAt'),
        updatedAt: user.get('updatedAt'),
      },
    });

  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json(formatError(ErrorCodes.SERVER_ERROR));
  }
});

/**
 * ELIMINAR CUENTA DE USUARIO (Soft Delete - Eliminación Lógica)
 * DELETE /auth/profile
 * 
 * Marca la cuenta del usuario como eliminada (soft delete)
 * Los datos NO se borran físicamente de la base de datos
 * El usuario marcado como eliminado no podrá hacer login
 * Los datos siguen existiendo para auditoría/histórico
 * Requiere autenticación (debe proporcionar un token válido)
 */
router.delete('/profile', authMiddleware, async (req: AuthRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json(formatError(ErrorCodes.AUTH.TOKEN_INVALID));
    }

    // Buscar el usuario
    const user = await User.findByPk(req.user.id);
    if (!user) {
      return res.status(401).json(formatError(ErrorCodes.AUTH.USER_NOT_FOUND));
    }

    const userEmail = user.get('email');
    const userId = (user as any).id;

    // SOFT DELETE: Marcar usuario como eliminado
    // Sequelize con paranoid: true efectúa soft delete (setea deletedAt, no elimina físicamente)
    // También se marca id_estado=2 (Inactivo) y lastLoginAt=null
    // Política: Nada se elimina físicamente. Todo es soft delete permanente.
    await user.update({ id_estado: 2, lastLoginAt: null }); // 2 = Inactivo
    await user.destroy(); // Con paranoid:true, esto es soft delete (no destruye físicamente)

    // Agregar el token actual a la blacklist para invalidarlo
    const token = req.headers.authorization?.split(' ')[1];
    if (token) {
      addTokenToBlacklist(token);
    }

    res.status(200).json({
      message: 'User account deleted successfully',
      deleted: {
        id: userId,
        email: userEmail,
        deletedAt: new Date()
      },
      info: 'Account is marked as deleted but data is retained for audit purposes. User cannot login. lastLoginAt cleared.',
    });
  } catch (error) {
    console.error('Delete profile error:', error);
    res.status(500).json(formatError(ErrorCodes.SERVER_ERROR));
  }
});

/**
 * CAMBIAR CONTRASEÑA
 * PATCH /auth/change-password
 * 
 * Permite al usuario cambiar su contraseña
 * Requiere autenticación (debe proporcionar un token válido)
 * Validaciones:
 * - Las nuevas contraseñas deben coincidir (password === confirmPassword)
 * - Contraseña debe tener al menos 6 caracteres
 */
router.patch('/change-password', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { password, confirmPassword } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json(formatError(ErrorCodes.AUTH.TOKEN_INVALID));
    }

    // Validar que ambos campos estén presentes
    if (!password || !confirmPassword) {
      return res.status(400).json(formatError(
        ErrorCodes.PROFILE.NO_FIELDS_TO_UPDATE,
        'Both password and confirmPassword are required'
      ));
    }

    // Validar que las contraseñas coincidan
    if (password !== confirmPassword) {
      return res.status(400).json(formatError(
        ErrorCodes.PROFILE.INVALID_BIRTHDATE,
        'Passwords do not match'
      ));
    }

    // Validar longitud mínima de contraseña
    if (password.length < 6) {
      return res.status(400).json(formatError(
        ErrorCodes.PROFILE.INVALID_BIRTHDATE,
        'Password must be at least 6 characters long'
      ));
    }

    // Obtener usuario actual
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json(formatError(ErrorCodes.AUTH.USER_NOT_FOUND));
    }

    // Hash de la nueva contraseña
    const hashedPassword = await bcryptjs.hash(password, 10);

    // Actualizar contraseña
    await user.update({ password: hashedPassword });

    res.status(200).json({
      message: 'Password updated successfully',
      user: {
        id: (user as any).id,
        email: (user as any).email,
        firstName: (user as any).firstName,
      }
    });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json(formatError(ErrorCodes.SERVER_ERROR));
  }
});

/**
 * LOGOUT (Invalida el token)
 * GET /auth/logout
 * 
 * Invalida el token JWT actual agregándolo a una blacklist
 * Después de logout, el usuario NO podrá usar ese token para acceder a recursos protegidos
 * Requiere autenticación (debe proporcionar un token válido)
 */
router.get('/logout', authMiddleware, (req: AuthRequest, res) => {
  try {
    // Obtener el token del header
    const token = req.headers.authorization?.split(' ')[1];

    if (token) {
      // Agregar el token a la blacklist (lista de tokens invalidados)
      addTokenToBlacklist(token);
    }

    res.status(200).json({ message: 'Logout successful. Token has been invalidated.' });
  } catch (error) {
    res.status(500).json({ error: 'Error logging out' });
  }
});

export default router;
