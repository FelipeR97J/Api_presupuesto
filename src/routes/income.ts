import express from 'express';
import { Income } from '../entityDB/mysql/income';
import { IncomeCategory } from '../entityDB/mysql/incomeCategory';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { ErrorCodes, formatError } from '../utils/errorCodes';

const router = express.Router();

/**
 * HU1 - Registrar ingreso
 * POST /income/
 * Permite al usuario registrar un ingreso de dinero
 * Body: { amount: number, categoryId: number, description?: string, date?: Date }
 * 
 * REQUIERE AUTENTICACIÓN (token JWT)
 */
router.post('/', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { amount, categoryId, description, date } = req.body;
    
    if (!req.user) {
      return res.status(401).json(formatError(ErrorCodes.AUTH.TOKEN_INVALID));
    }
    
    // Validar que el monto sea obligatorio
    if (!amount) {
      return res.status(400).json(formatError(ErrorCodes.INCOME.AMOUNT_REQUIRED));
    }

    // Validar que la categoría sea obligatoria
    if (!categoryId) {
      return res.status(400).json(formatError(ErrorCodes.INCOME.CATEGORY_REQUIRED));
    }

    // Verificar que la categoría existe y está activa
    const category = await IncomeCategory.findOne({
      where: { 
        id: categoryId,
        id_estado: 1, // 1 = Activo
      },
    });

    if (!category) {
      return res.status(404).json(formatError(ErrorCodes.INCOME.CATEGORY_NOT_FOUND));
    }
    
    // Crear un nuevo registro de ingreso con userId del usuario autenticado
    const income = await Income.create({
      userId: req.user.id,
      categoryId,
      amount,
      description,
      date: date || new Date(),
    });

    // Incluir la categoría en la respuesta
    await income.reload({ include: ['category'] });
    
    res.status(201).json(income);
  } catch (error) {
    res.status(500).json(formatError(ErrorCodes.SERVER_ERROR));
  }
});

/**
 * Obtener todos los ingresos del usuario autenticado
 * GET /income/
 * Retorna una lista de todos los ingresos activos del usuario con sus categorías
 * 
 * REQUIERE AUTENTICACIÓN (token JWT)
 */
/**
 * HU1 - OBTENER INGRESOS DEL USUARIO
 * GET /income/?page=1&limit=10
 * Retorna los ingresos activos del usuario autenticado
 * 
 * PARÁMETROS DE QUERY:
 * - page (Number, default=1): Número de página (comienza en 1)
 * - limit (Number, default=10): Cantidad de registros por página (máximo 100)
 * 
 * REQUIERE AUTENTICACIÓN (token JWT)
 * 
 * 📝 CAMBIO: Añadida paginación para mejorar rendimiento con muchos registros
 */
router.get('/', authMiddleware, async (req: AuthRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    // Obtener parámetros de paginación
    let page = parseInt(req.query.page as string) || 1;
    let limit = parseInt(req.query.limit as string) || 10;

    // Validar valores
    if (page < 1) page = 1;
    if (limit < 1) limit = 10;
    if (limit > 100) limit = 100; // Máximo 100 registros por página

    const offset = (page - 1) * limit;

    // Obtener total de ingresos (activos e inactivos) del usuario
    const total = await Income.count({
      where: { 
        userId: req.user.id,
        // id_estado: 1, // Eliminado filtro para contar todos
      },
    });

    // Buscar ingresos (activos e inactivos) del usuario autenticado, incluir categoría
    const incomes = await Income.findAll({
      where: { 
        userId: req.user.id,
        // id_estado: 1, // Eliminado filtro para mostrar todos
      },
      include: ['category'],
      order: [['id_estado', 'ASC'], ['description', 'ASC']], // Activos primero, luego alfabético por descripción
      limit,
      offset,
    });

    // Calcular información de paginación
    const totalPages = Math.ceil(total / limit);

    res.status(200).json({
      data: incomes,
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
    res.status(500).json({ error: 'Error fetching incomes' });
  }
});

/**
 * Obtener ingreso por ID
 * GET /income/:id
 * Retorna un ingreso específico por su ID (solo si pertenece al usuario y está activo)
 * 
 * REQUIERE AUTENTICACIÓN (token JWT)
 */
router.get('/:id', authMiddleware, async (req: AuthRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json(formatError(ErrorCodes.AUTH.TOKEN_INVALID));
    }

    const income = await Income.findOne({
      where: {
        id: req.params.id,
        userId: req.user.id, // Verificar que pertenece al usuario
        // Mostrar tanto activos (id_estado: 1) como inactivos (id_estado: 2)
        // paranoid: true excluye automáticamente eliminados (deletedAt != null)
      },
      include: ['category'],
    });
    
    if (!income) {
      return res.status(404).json(formatError(ErrorCodes.INCOME.INCOME_NOT_FOUND));
    }
    res.status(200).json(income);
  } catch (error) {
    res.status(500).json(formatError(ErrorCodes.SERVER_ERROR));
  }
});

/**
 * Editar ingreso
 * PATCH /income/:id
 * Permite actualizar los datos de un ingreso existente
 * Body: { amount?: number, categoryId?: number, description?: string, date?: Date }
 * 
 * REQUIERE AUTENTICACIÓN (token JWT)
 */
router.patch('/:id', authMiddleware, async (req: AuthRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json(formatError(ErrorCodes.AUTH.TOKEN_INVALID));
    }

    const { amount, categoryId, description, date } = req.body;

    // Verificar que el ingreso existe y pertenece al usuario
    const income = await Income.findOne({
      where: {
        id: req.params.id,
        userId: req.user.id,
      },
    });

    if (!income) {
      return res.status(404).json(formatError(ErrorCodes.INCOME.INCOME_NOT_FOUND));
    }

    // Validar categoría si se proporciona
    if (categoryId !== undefined) {
      const category = await IncomeCategory.findOne({
        where: { 
          id: categoryId,
          id_estado: 1, // 1 = Activo
        },
      });

      if (!category) {
        return res.status(404).json(formatError(ErrorCodes.INCOME.CATEGORY_NOT_FOUND));
      }

      income.set('categoryId', categoryId);
    }

    // Actualizar solo los campos que se envían
    if (amount !== undefined) income.set('amount', amount);
    if (description !== undefined) income.set('description', description);
    if (date !== undefined) income.set('date', date);

    await income.save();
    
    // Recargar para incluir la categoría
    await income.reload({ include: ['category'] });
    
    res.status(200).json(income);
  } catch (error) {
    res.status(500).json(formatError(ErrorCodes.SERVER_ERROR));
  }
});

/**
 * Eliminar ingreso (Soft Delete)
 * DELETE /income/:id
 * Marca el ingreso como inactivo en lugar de eliminarlo
 * Los datos se retienen para auditoría
 * 
 * REQUIERE AUTENTICACIÓN (token JWT)
 */
router.delete('/:id', authMiddleware, async (req: AuthRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json(formatError(ErrorCodes.AUTH.TOKEN_INVALID));
    }

    const income = await Income.findOne({
      where: {
        id: req.params.id,
        userId: req.user.id,
      },
    });

    if (!income) {
      return res.status(404).json(formatError(ErrorCodes.INCOME.INCOME_NOT_FOUND));
    }

    // Soft delete real usando deletedAt
    await income.destroy();

    res.status(200).json({ 
      message: 'Income deleted successfully',
      income: {
        id: income.get('id'),
        deletedAt: new Date()
      }
    });
  } catch (error) {
    res.status(500).json(formatError(ErrorCodes.SERVER_ERROR));
  }
});

export default router;
