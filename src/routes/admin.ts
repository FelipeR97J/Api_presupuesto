import express from 'express';
import { User } from '../entityDB/mysql/user';
import { Role } from '../entityDB/mysql/role';
import { authMiddleware } from '../middleware/auth';
import { adminMiddleware, AuthRequest } from '../middleware/adminAuth';
import { calculateAge } from '../services/dateUtils';

const router = express.Router();

/**
 * OBTENER TODOS LOS USUARIOS (Solo Admin)
 * GET /admin/users/
 * 
 * Permite al administrador ver todos los usuarios del sistema
 * Incluye: usuarios activos, inactivos y eliminados (soft delete)
 * REQUIERE: Rol de administrador
 */
router.get('/users/', authMiddleware, adminMiddleware, async (req: AuthRequest, res) => {
  try {
    // Obtener todos los usuarios (incluyendo eliminados)
    const users = await User.findAll({
      attributes: { exclude: ['password'] },
      paranoid: false, // Incluir usuarios eliminados
      order: [['createdAt', 'DESC']],
    });

    const usersFormatted = users.map((user: any) => ({
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      paternalLastName: user.paternalLastName,
      maternalLastName: user.maternalLastName,
      rut: user.rut,
      role: user.role,
      id_estado: (user as any).id_estado,
      estado: (user as any).id_estado === 1 ? 'Activo' : 'Inactivo',
      isDeleted: user.deletedAt !== null,
      createdAt: user.createdAt,
      lastLoginAt: user.lastLoginAt,
    }));

    res.status(200).json({
      message: 'Usuarios obtenidos correctamente',
      total: usersFormatted.length,
      users: usersFormatted,
    });
  } catch (error) {
    res.status(500).json({ error: 'Error obteniendo usuarios' });
  }
});

/**
 * OBTENER USUARIO POR ID (Solo Admin)
 * GET /admin/users/:id
 * 
 * Permite al administrador ver los detalles de un usuario específico
 * REQUIERE: Rol de administrador
 */
router.get('/users/:id', adminMiddleware, async (req: AuthRequest, res) => {
  try {
    const user = await User.findByPk(req.params.id, {
      attributes: { exclude: ['password'] },
      paranoid: false,
    });

    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    res.status(200).json({
      id: (user as any).id,
      email: user.get('email'),
      firstName: user.get('firstName'),
      paternalLastName: user.get('paternalLastName'),
      maternalLastName: user.get('maternalLastName'),
      rut: user.get('rut'),
      phoneNumber: user.get('phoneNumber'),
      birthDate: user.get('birthDate'),
      age: calculateAge(user.get('birthDate') as Date),
      role: user.get('role'),
      id_estado: (user as any).id_estado,
      estado: (user as any).id_estado === 1 ? 'Activo' : 'Inactivo',
      isDeleted: user.get('deletedAt') !== null,
      lastLoginAt: user.get('lastLoginAt'),
      createdAt: user.get('createdAt'),
      updatedAt: user.get('updatedAt'),
    });
  } catch (error) {
    res.status(500).json({ error: 'Error obteniendo usuario' });
  }
});

/**
 * SUSPENDER USUARIO (Solo Admin)
 * PATCH /admin/users/:id/suspend
 * 
 * Marca la cuenta de un usuario como inactiva (suspendida)
 * Restricciones:
 * - No se puede suspender a sí mismo
 * - El usuario suspendido no puede acceder a la API
 * 
 * REQUIERE: Rol de administrador
 */
router.patch('/users/:id/suspend', adminMiddleware, async (req: AuthRequest, res) => {
  try {
    const targetUserId = parseInt(req.params.id);

    // Validar que no sea el mismo usuario
    if (req.user!.id === targetUserId) {
      return res.status(400).json({
        error: 'No se puede suspender tu propia cuenta',
        message: 'Solicita a otro administrador que lo haga',
      });
    }

    // Buscar el usuario
    const user = await User.findByPk(targetUserId);
    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    // Verificar si ya está suspendido
    if (user.get('id_estado') === 2) {
      return res.status(400).json({
        error: 'El usuario ya está suspendido',
      });
    }

    // Suspender la cuenta
    await user.update({ id_estado: 2 });

    res.status(200).json({
      message: 'Usuario suspendido correctamente',
      user: {
        id: (user as any).id,
        email: user.get('email'),
        firstName: user.get('firstName'),
        id_estado: 2,
      },
    });
  } catch (error) {
    res.status(500).json({ error: 'Error suspendiendo usuario' });
  }
});

/**
 * REACTIVAR USUARIO (Solo Admin)
 * PATCH /admin/users/:id/reactivate
 * 
 * Marca la cuenta de un usuario como activa nuevamente
 * REQUIERE: Rol de administrador
 */
router.patch('/users/:id/reactivate', adminMiddleware, async (req: AuthRequest, res) => {
  try {
    const targetUserId = parseInt(req.params.id);

    // Buscar el usuario
    const user = await User.findByPk(targetUserId, {
      paranoid: false, // Incluir usuarios eliminados
    });

    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    // Verificar si ya está activo
    if (user.get('id_estado') === 1) {
      return res.status(400).json({
        error: 'El usuario ya está activo',
      });
    }

    // Reactivar la cuenta
    await user.update({ id_estado: 1 });

    res.status(200).json({
      message: 'Usuario reactivado correctamente',
      user: {
        id: (user as any).id,
        email: user.get('email'),
        firstName: user.get('firstName'),
        id_estado: 1,
      },
    });
  } catch (error) {
    res.status(500).json({ error: 'Error reactivando usuario' });
  }
});

/**
 * OBTENER ESTADÍSTICAS DEL SISTEMA (Solo Admin)
 * GET /admin/stats/
 * 
 * Retorna estadísticas sobre los usuarios del sistema
 * REQUIERE: Rol de administrador
 */
router.get('/stats/', adminMiddleware, async (req: AuthRequest, res) => {
  try {
    const totalUsers = await User.count({ paranoid: false });
    const activeUsers = await User.count({ where: { isActive: true } });
    const admins = await User.count({ where: { role: 'admin' } });
    const regularUsers = await User.count({ where: { role: 'user' } });
    const deletedUsers = await User.count({ where: { deletedAt: { [require('sequelize').Op.ne]: null } }, paranoid: false });
    const suspendedUsers = await User.count({ where: { isActive: false } });

    res.status(200).json({
      message: 'Estadísticas del sistema',
      stats: {
        totalUsers,
        activeUsers,
        deletedUsers,
        suspendedUsers,
        admins,
        regularUsers,
      },
      percentages: {
        activeUsersPercent: ((activeUsers / totalUsers) * 100).toFixed(2) + '%',
        adminsPercent: ((admins / totalUsers) * 100).toFixed(2) + '%',
      },
    });
  } catch (error) {
    res.status(500).json({ error: 'Error obteniendo estadísticas' });
  }
});

/**
 * ASIGNAR ROL A USUARIO (Solo Admin)
 * POST /admin/users/:userId/assign-role
 * 
 * Asigna un rol específico a un usuario (actualiza id_rol)
 * Body: { roleId: number }
 */
router.post('/users/:userId/assign-role', authMiddleware, adminMiddleware, async (req: AuthRequest, res) => {
  try {
    const { userId } = req.params;
    const { roleId } = req.body;

    // Validar que roleId esté presente
    if (!roleId) {
      return res.status(400).json({ error: 'roleId es requerido' });
    }

    // Verificar que el usuario existe
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    // Verificar que el rol existe
    const role = await Role.findByPk(roleId);
    if (!role) {
      return res.status(404).json({ error: 'Rol no encontrado' });
    }

    // Actualizar el id_rol del usuario
    (user as any).set('id_rol', roleId);
    await user.save();

    res.status(200).json({
      message: `Rol ${(role as any).name} asignado correctamente a usuario ID=${userId}`,
      user: {
        id: (user as any).id,
        email: user.get('email'),
        firstName: user.get('firstName'),
        id_rol: roleId,
        roleName: (role as any).name,
        updatedBy: req.user?.id || null,
        updatedAt: new Date(),
      },
    });
  } catch (error) {
    console.error('Error asignando rol:', error);
    res.status(500).json({ error: 'Error asignando rol' });
  }
});

/**
 * REVOCAR ROL DE USUARIO (Solo Admin)
 * DELETE /admin/users/:userId/revoke-role
 * 
 * Revoca el rol de un usuario (pone id_rol en NULL)
 */
router.delete('/users/:userId/revoke-role', authMiddleware, adminMiddleware, async (req: AuthRequest, res) => {
  try {
    const { userId } = req.params;

    // Verificar que el usuario existe
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    // Obtener rol actual
    const currentRoleId = (user as any).get('id_rol');
    if (!currentRoleId) {
      return res.status(400).json({ error: 'El usuario no tiene rol asignado' });
    }

    const role = await Role.findByPk(currentRoleId);

    // Revocar el rol (poner id_rol en NULL)
    (user as any).set('id_rol', null);
    await user.save();

    res.status(200).json({
      message: `Rol ${(role as any).name} revocado correctamente del usuario ID=${userId}`,
      user: {
        id: (user as any).id,
        email: user.get('email'),
        firstName: user.get('firstName'),
        id_rol: null,
        updatedBy: req.user?.id || null,
        updatedAt: new Date(),
      },
    });
  } catch (error) {
    console.error('Error revocando rol:', error);
    res.status(500).json({ error: 'Error revocando rol' });
  }
});

export default router;
