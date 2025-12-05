import express from 'express';
import { IncomeCategory } from '../entityDB/mysql/incomeCategory';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { ErrorCodes, formatError } from '../utils/errorCodes';

const router = express.Router();

/**
 * OBTENER TODAS LAS CATEGORÍAS DE INGRESOS
 * GET /income-categories/?page=1&limit=10
 * Retorna las categorías disponibles (sistema + personalizadas)
 * Públicamente accesible (no requiere autenticación)
 * 
 * PARÁMETROS DE QUERY:
 * - page (Number, default=1): Número de página (comienza en 1)
 * - limit (Number, default=10): Cantidad de registros por página (máximo 100)
 * 
 * 📝 CAMBIO: Ahora muestra categorías ACTIVAS E INACTIVAS (pero NO eliminadas)
 * Esto permite que desde el frontend puedas activar/desactivar las categorías
 * Las categorías eliminadas (soft delete) NO se muestran
 */
router.get('/', async (req, res) => {
  try {
    // Obtener parámetros de paginación
    let page = parseInt(req.query.page as string) || 1;
    let limit = parseInt(req.query.limit as string) || 10;

    // Validar valores
    if (page < 1) page = 1;
    if (limit < 1) limit = 10;
    if (limit > 100) limit = 100; // Máximo 100 registros por página

    const offset = (page - 1) * limit;

    // Obtener total de categorías
    const total = await IncomeCategory.count({
      where: { }, // Sin filtro de estado - contar todas (activas e inactivas)
    });

    // Mostrar categorías activas E inactivas, pero NO eliminadas (soft delete)
    // paranoid: true excluye automáticamente registros con deletedAt != null
    const categories = await IncomeCategory.findAll({
      where: { }, // Sin filtro de estado - mostrar todas (activas e inactivas)
      order: [['id_estado', 'ASC'], ['name', 'ASC']], // Activos primero, luego alfabético
      limit,
      offset,
    });

    // Calcular información de paginación
    const totalPages = Math.ceil(total / limit);

    res.status(200).json({
      data: categories,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    });
  } catch (error) {
    res.status(500).json(formatError(ErrorCodes.SERVER_ERROR));
  }
});

/**
 * OBTENER CATEGORÍA POR ID
 * GET /income-categories/:id
 * Retorna una categoría específica
 */
router.get('/:id', async (req, res) => {
  try {
    const category = await IncomeCategory.findByPk(req.params.id);
    
    if (!category) {
      return res.status(404).json(formatError(ErrorCodes.INCOME_CATEGORY.CATEGORY_NOT_FOUND));
    }
    res.status(200).json(category);
  } catch (error) {
    res.status(500).json(formatError(ErrorCodes.SERVER_ERROR));
  }
});

/**
 * CREAR NUEVA CATEGORÍA PERSONALIZADA
 * POST /income-categories/
 * Body: { name: string, description?: string }
 * 
 * Cualquier usuario autenticado puede crear categorías personalizadas
 * Las categorías del sistema no pueden ser creadas desde aquí
 * REQUIERE AUTENTICACIÓN (token JWT)
 */
router.post('/', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { name, description } = req.body;

    if (!req.user) {
      return res.status(401).json(formatError(ErrorCodes.AUTH.TOKEN_INVALID));
    }

    if (!name) {
      return res.status(400).json(formatError(ErrorCodes.INCOME_CATEGORY.NAME_REQUIRED));
    }

    // Verificar que no exista una categoría con el mismo nombre
    const existingCategory = await IncomeCategory.findOne({
      where: { name },
    });

    if (existingCategory) {
      return res.status(400).json(formatError(ErrorCodes.INCOME_CATEGORY.DUPLICATE_NAME));
    }

    // Crear categoría personalizada (isSystem = false)
    const category = await IncomeCategory.create({
      name,
      description,
      id_estado: 1, // 1 = Activo
      isSystem: false,  // Categoría personalizada
      createdBy: req.user.id,  // Registrar quién la creó
    });

    res.status(201).json(category);
  } catch (error) {
    res.status(500).json(formatError(ErrorCodes.SERVER_ERROR));
  }
});

/**
 * ACTUALIZAR CATEGORÍA
 * PATCH /income-categories/:id
 * Body: { name?: string, description?: string, id_estado?: number }
 * 
 * RESTRICCIONES:
 * - No se puede actualizar si es categoría del sistema
 * - Solo el usuario que la creó puede actualizarla
 * - No se puede inactivar si tiene ingresos activos asociados
 * REQUIERE AUTENTICACIÓN (token JWT)
 */
router.patch('/:id', authMiddleware, async (req: AuthRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json(formatError(ErrorCodes.AUTH.TOKEN_INVALID));
    }

    const { name, description, id_estado } = req.body;
    const category = await IncomeCategory.findByPk(req.params.id);

    if (!category) {
      return res.status(404).json(formatError(ErrorCodes.INCOME_CATEGORY.CATEGORY_NOT_FOUND));
    }

    // Validar: No se puede modificar categoría del sistema
    if (category.get('isSystem') === true) {
      return res.status(403).json(formatError(ErrorCodes.INCOME_CATEGORY.SYSTEM_CATEGORY_CANNOT_MODIFY));
    }

    // Validar: Solo el usuario que creó puede actualizar
    if (category.get('createdBy') !== req.user.id) {
      return res.status(403).json(formatError(ErrorCodes.INCOME_CATEGORY.PERMISSION_DENIED));
    }

    // Si se intenta inactivar, verificar que no tenga ingresos activos
    if (id_estado === 2 && (category as any).id_estado === 1) {
      const { Income } = require('../entityDB/mysql/income');
      const incomeCount = await Income.count({
        where: { categoryId: req.params.id, id_estado: 1 }, // 1 = Activo
      });

      if (incomeCount > 0) {
        return res.status(400).json(formatError(ErrorCodes.INCOME_CATEGORY.CANNOT_DEACTIVATE_WITH_INCOMES));
      }
    }

    if (name !== undefined) category.set('name', name);
    if (description !== undefined) category.set('description', description);
    if (id_estado !== undefined) category.set('id_estado', id_estado);

    await category.save();
    res.status(200).json(category);
  } catch (error) {
    res.status(500).json(formatError(ErrorCodes.SERVER_ERROR));
  }
});

/**
 * ELIMINAR CATEGORÍA (Soft delete - solo marca como inactiva)
 * DELETE /income-categories/:id
 * 
 * RESTRICCIONES:
 * - No se puede eliminar categoría del sistema
 * - Solo el usuario que la creó puede eliminarla
 * - No se puede si tiene ingresos activos asociados
 * REQUIERE AUTENTICACIÓN (token JWT)
 */
router.delete('/:id', authMiddleware, async (req: AuthRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json(formatError(ErrorCodes.AUTH.TOKEN_INVALID));
    }

    const category = await IncomeCategory.findByPk(req.params.id);

    if (!category) {
      return res.status(404).json(formatError(ErrorCodes.INCOME_CATEGORY.CATEGORY_NOT_FOUND));
    }

    // Validar: No se puede eliminar categoría del sistema
    if (category.get('isSystem') === true) {
      return res.status(403).json(formatError(ErrorCodes.INCOME_CATEGORY.SYSTEM_CATEGORY_CANNOT_MODIFY));
    }

    // Validar: Solo el usuario que creó puede eliminar
    if (category.get('createdBy') !== req.user.id) {
      return res.status(403).json(formatError(ErrorCodes.INCOME_CATEGORY.PERMISSION_DENIED));
    }

    // Verificar si la categoría tiene ingresos activos asociados
    const { Income } = require('../entityDB/mysql/income');
    const incomeCount = await Income.count({
      where: { categoryId: req.params.id, id_estado: 1 }, // 1 = Activo
    });

    if (incomeCount > 0) {
      return res.status(400).json(formatError(ErrorCodes.INCOME_CATEGORY.CANNOT_DELETE_WITH_INCOMES));
    }

    // Soft delete real usando deletedAt
    await category.destroy();

    res.status(200).json({ 
      message: 'Category deleted successfully',
      id: req.params.id,
      deletedAt: new Date()
    });
  } catch (error) {
    res.status(500).json(formatError(ErrorCodes.SERVER_ERROR));
  }
});

export default router;
