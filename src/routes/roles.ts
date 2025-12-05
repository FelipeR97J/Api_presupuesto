import express from 'express';
import { Role } from '../entityDB/mysql/role';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { adminMiddleware } from '../middleware/adminAuth';

const router = express.Router();

/**
 * CREAR NUEVO ROL (Solo Admin)
 * POST /roles
 * 
 * Body esperado:
 * {
 *   "name": "string",
 *   "description": "string",
 *   "permissions": { ... },
 *   "id_estado": number (1=Activo, 2=Inactivo)
 * }
 */
router.post('/', authMiddleware, adminMiddleware, async (req: AuthRequest, res) => {
  try {
    const { name, description, permissions, id_estado } = req.body;

    // Validar campos requeridos
    if (!name) {
      return res.status(400).json({ error: 'El nombre del rol es requerido' });
    }

    // Verificar si el rol ya existe
    const existingRole = await Role.findOne({ where: { name } });
    if (existingRole) {
      return res.status(400).json({ error: 'El rol ya existe' });
    }

    // Crear el nuevo rol
    const newRole = await Role.create({
      name,
      description: description || '',
      permissions: permissions || {},
      id_estado: id_estado !== undefined ? id_estado : 1, // 1 = Activo
    });

    res.status(201).json({
      message: 'Rol creado correctamente',
      role: {
        id: (newRole as any).id,
        name: (newRole as any).name,
        description: (newRole as any).description,
        permissions: (newRole as any).permissions,
        id_estado: (newRole as any).id_estado,
        createdAt: (newRole as any).createdAt,
      },
    });
  } catch (error) {
    console.error('Error creando rol:', error);
    res.status(500).json({ error: 'Error creando rol' });
  }
});

/**
 * OBTENER TODOS LOS ROLES
 * GET /api/roles
 */
router.get('/', async (req, res) => {
  try {
    const roles = await Role.findAll({
      order: [['id', 'ASC']],
    });

    res.status(200).json({
      message: 'Roles obtenidos correctamente',
      total: roles.length,
      roles: roles.map((role: any) => ({
        id: role.id,
        name: role.name,
        description: role.description,
        permissions: role.permissions,
        id_estado: role.id_estado,
        createdAt: role.createdAt,
      })),
    });
  } catch (error) {
    console.error('Error obteniendo roles:', error);
    res.status(500).json({ error: 'Error obteniendo roles' });
  }
});

/**
 * OBTENER ROL POR ID
 * GET /api/roles/:id
 */
router.get('/:id', async (req, res) => {
  try {
    const role = await Role.findByPk(req.params.id);

    if (!role) {
      return res.status(404).json({ error: 'Rol no encontrado' });
    }

    res.status(200).json({
      message: 'Rol obtenido correctamente',
      role: {
        id: (role as any).id,
        name: (role as any).name,
        description: (role as any).description,
        permissions: (role as any).permissions,
        id_estado: (role as any).id_estado,
        createdAt: (role as any).createdAt,
      },
    });
  } catch (error) {
    console.error('Error obteniendo rol:', error);
    res.status(500).json({ error: 'Error obteniendo rol' });
  }
});

/**
 * ACTUALIZAR ROL (Solo Admin)
 * PUT /roles/:id
 */
router.put('/:id', authMiddleware, adminMiddleware, async (req: AuthRequest, res) => {
  try {
    const { name, description, permissions, id_estado } = req.body;
    const role = await Role.findByPk(req.params.id);

    if (!role) {
      return res.status(404).json({ error: 'Rol no encontrado' });
    }

    // Verificar si el nuevo nombre ya existe
    if (name && name !== (role as any).name) {
      const existingRole = await Role.findOne({ where: { name } });
      if (existingRole) {
        return res.status(400).json({ error: 'El nombre del rol ya existe' });
      }
    }

    // Actualizar el rol
    await (role as any).update({
      name: name || (role as any).name,
      description: description !== undefined ? description : (role as any).description,
      permissions: permissions || (role as any).permissions,
      id_estado: id_estado !== undefined ? id_estado : (role as any).id_estado,
    });

    res.status(200).json({
      message: 'Rol actualizado correctamente',
      role: {
        id: (role as any).id,
        name: (role as any).name,
        description: (role as any).description,
        permissions: (role as any).permissions,
        id_estado: (role as any).id_estado,
        updatedAt: (role as any).updatedAt,
      },
    });
  } catch (error) {
    console.error('Error actualizando rol:', error);
    res.status(500).json({ error: 'Error actualizando rol' });
  }
});

/**
 * ELIMINAR ROL (Solo Admin)
 * DELETE /roles/:id
 */
router.delete('/:id', authMiddleware, adminMiddleware, async (req: AuthRequest, res) => {
  try {
    const role = await Role.findByPk(req.params.id);

    if (!role) {
      return res.status(404).json({ error: 'Rol no encontrado' });
    }

    // No permitir eliminar roles del sistema (admin, user)
    if ((role as any).name === 'admin' || (role as any).name === 'user') {
      return res.status(400).json({ error: 'No se pueden eliminar roles del sistema' });
    }

    await (role as any).destroy();

    res.status(200).json({
      message: 'Rol eliminado correctamente',
      role: {
        id: req.params.id,
        deletedAt: new Date()
      }
    });
  } catch (error) {
    console.error('Error eliminando rol:', error);
    res.status(500).json({ error: 'Error eliminando rol' });
  }
});

export default router;
