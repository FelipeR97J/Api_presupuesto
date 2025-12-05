import express from 'express';
import { User } from '../entityDB/mysql/user';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { adminMiddleware } from '../middleware/adminAuth';

const router = express.Router();

/**
 * OBTENER TODOS LOS ESTADOS
 * GET /estados
 * 
 * Retorna la lista de estados disponibles del sistema
 */
router.get('/', (req, res) => {
  res.status(200).json({
    message: 'Estados del sistema',
    estados: [
      {
        id: 0,
        name: 'Activo',
        description: 'Registro activo en el sistema',
      },
      {
        id: 1,
        name: 'Inactivo',
        description: 'Registro inactivo/suspendido',
      },
    ],
  });
});

/**
 * CAMBIAR ESTADO DE USUARIO (Solo Admin)
 * PATCH /admin/users/:userId/estado
 * 
 * Permite cambiar el estado de un usuario entre activo (0) e inactivo (1)
 * Solo accesible por administradores
 */
router.patch(
  '/admin/users/:userId/estado',
  authMiddleware,
  adminMiddleware,
  async (req: AuthRequest, res) => {
    try {
      const { userId } = req.params;
      const { id_estado } = req.body;

      // Validar que id_estado sea 1 (Activo) o 2 (Inactivo)
      if (id_estado !== 1 && id_estado !== 2) {
        return res.status(400).json({
          error: 'Estado inválido',
          message: 'El estado debe ser 1 (Activo) o 2 (Inactivo)',
        });
      }

      // Buscar el usuario
      const user = await User.findByPk(userId);
      if (!user) {
        return res.status(404).json({ error: 'Usuario no encontrado' });
      }

      // No permitir que un admin cambie su propio estado
      if ((req.user as any).id === parseInt(userId)) {
        return res.status(400).json({
          error: 'No se puede cambiar tu propio estado',
          message: 'Solicita a otro administrador que cambie tu estado',
        });
      }

      // Actualizar estado
      (user as any).id_estado = id_estado;
      await user.save();

      res.status(200).json({
        message: `Usuario ${id_estado === 1 ? 'activado' : 'desactivado'} correctamente`,
        user: {
          id: (user as any).id,
          email: user.get('email'),
          firstName: user.get('firstName'),
          id_estado: (user as any).id_estado,
          estado: (user as any).id_estado === 1 ? 'Activo' : 'Inactivo',
        },
      });
    } catch (error) {
      console.error('Change estado error:', error);
      res.status(500).json({ error: 'Error al cambiar estado' });
    }
  }
);

/**
 * OBTENER ESTADO DE USUARIO
 * GET /admin/users/:userId/estado
 * 
 * Retorna el estado actual de un usuario específico
 */
router.get(
  '/admin/users/:userId/estado',
  authMiddleware,
  adminMiddleware,
  async (req: AuthRequest, res) => {
    try {
      const { userId } = req.params;

      const user = await User.findByPk(userId);
      if (!user) {
        return res.status(404).json({ error: 'Usuario no encontrado' });
      }

      res.status(200).json({
        id: (user as any).id,
        email: user.get('email'),
        firstName: user.get('firstName'),
        id_estado: (user as any).id_estado,
        estado: (user as any).id_estado === 1 ? 'Activo' : 'Inactivo',
        description:
          (user as any).id_estado === 1
            ? 'Usuario puede hacer login'
            : 'Usuario suspendido, no puede hacer login',
      });
    } catch (error) {
      console.error('Get estado error:', error);
      res.status(500).json({ error: 'Error al obtener estado' });
    }
  }
);

export default router;
