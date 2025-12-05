import express from 'express';
import { Expense } from '../entityDB/mysql/expense';
import { ExpenseCategory } from '../entityDB/mysql/expenseCategory';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { ErrorCodes, formatError } from '../utils/errorCodes';

const router = express.Router();

/**
 * HU2 - Registrar gasto
 * POST /expense/
 * Permite al usuario registrar un gasto con categoría asociada
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
    
    // Validar que monto sea obligatorio
    if (!amount) {
      return res.status(400).json(formatError(ErrorCodes.EXPENSE.AMOUNT_REQUIRED));
    }

    // Validar que categoría sea obligatoria
    if (!categoryId) {
      return res.status(400).json(formatError(ErrorCodes.EXPENSE.CATEGORY_REQUIRED));
    }

    // Verificar que la categoría existe y está activa
    const category = await ExpenseCategory.findOne({
      where: { 
        id: categoryId,
        id_estado: 1, // 1 = Activo
      },
    });

    if (!category) {
      return res.status(404).json(formatError(ErrorCodes.EXPENSE.CATEGORY_NOT_FOUND));
    }
    
    // Crear un nuevo registro de gasto con userId del usuario autenticado
    const expense = await Expense.create({
      userId: req.user.id,
      categoryId,
      amount,
      description,
      date: date || new Date(),
    });

    // Incluir la categoría en la respuesta
    await expense.reload({ include: ['category'] });

    res.status(201).json(expense);
  } catch (error) {
    res.status(500).json(formatError(ErrorCodes.SERVER_ERROR));
  }
});

/**
 * Obtener todos los gastos del usuario autenticado
 * GET /expense/
 * Retorna una lista de todos los gastos activos del usuario con sus categorías
 * 
 * REQUIERE AUTENTICACIÓN (token JWT)
 */
/**
 * HU2 - OBTENER GASTOS DEL USUARIO
 * GET /expense/?page=1&limit=10
 * Retorna los gastos activos del usuario autenticado
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
      return res.status(401).json(formatError(ErrorCodes.AUTH.TOKEN_INVALID));
    }

    // Obtener parámetros de paginación
    let page = parseInt(req.query.page as string) || 1;
    let limit = parseInt(req.query.limit as string) || 10;

    // Validar valores
    if (page < 1) page = 1;
    if (limit < 1) limit = 10;
    if (limit > 100) limit = 100; // Máximo 100 registros por página

    const offset = (page - 1) * limit;

    // Obtener total de gastos (activos e inactivos) del usuario
    const total = await Expense.count({
      where: { 
        userId: req.user.id, 
        // id_estado: 1, // Eliminado filtro para contar todos
      },
    });

    const expenses = await Expense.findAll({
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
      data: expenses,
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
 * Obtener gasto por ID
 * GET /expense/:id
 * Retorna un gasto específico por su ID (solo si pertenece al usuario y está activo)
 * 
 * REQUIERE AUTENTICACIÓN (token JWT)
 */
router.get('/:id', authMiddleware, async (req: AuthRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json(formatError(ErrorCodes.AUTH.TOKEN_INVALID));
    }

    const expense = await Expense.findOne({
      where: {
        id: req.params.id,
        userId: req.user.id, // Verificar que pertenece al usuario
        // Mostrar tanto activos (id_estado: 1) como inactivos (id_estado: 2)
        // paranoid: true excluye automáticamente eliminados (deletedAt != null)
      },
      include: ['category'],
    });
    
    if (!expense) {
      return res.status(404).json(formatError(ErrorCodes.EXPENSE.EXPENSE_NOT_FOUND));
    }
    res.status(200).json(expense);
  } catch (error) {
    res.status(500).json(formatError(ErrorCodes.SERVER_ERROR));
  }
});

/**
 * Editar gasto
 * PATCH /expense/:id
 * Permite actualizar los datos de un gasto existente
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

    // Verificar que el gasto existe y pertenece al usuario
    const expense = await Expense.findOne({
      where: {
        id: req.params.id,
        userId: req.user.id,
      },
    });

    if (!expense) {
      return res.status(404).json(formatError(ErrorCodes.EXPENSE.EXPENSE_NOT_FOUND));
    }

    // Validar categoría si se proporciona
    if (categoryId !== undefined) {
      const category = await ExpenseCategory.findOne({
        where: { 
          id: categoryId,
          id_estado: 1, // 1 = Activo
        },
      });

      if (!category) {
        return res.status(404).json(formatError(ErrorCodes.EXPENSE.CATEGORY_NOT_FOUND));
      }

      expense.set('categoryId', categoryId);
    }

    // Actualizar solo los campos que se envían
    if (amount !== undefined) expense.set('amount', amount);
    if (description !== undefined) expense.set('description', description);
    if (date !== undefined) expense.set('date', date);

    await expense.save();
    
    // Recargar para incluir la categoría
    await expense.reload({ include: ['category'] });
    
    res.status(200).json(expense);
  } catch (error) {
    res.status(500).json(formatError(ErrorCodes.SERVER_ERROR));
  }
});

/**
 * Eliminar gasto (Soft Delete)
 * DELETE /expense/:id
 * Marca el gasto como inactivo en lugar de eliminarlo
 * Los datos se retienen para auditoría
 * 
 * REQUIERE AUTENTICACIÓN (token JWT)
 */
router.delete('/:id', authMiddleware, async (req: AuthRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json(formatError(ErrorCodes.AUTH.TOKEN_INVALID));
    }

    const expense = await Expense.findOne({
      where: {
        id: req.params.id,
        userId: req.user.id,
      },
    });

    if (!expense) {
      return res.status(404).json(formatError(ErrorCodes.EXPENSE.EXPENSE_NOT_FOUND));
    }

    // Soft delete real usando deletedAt
    await expense.destroy();

    res.status(200).json({ 
      message: 'Expense deleted successfully',
      expense: {
        id: expense.get('id'),
        deletedAt: new Date()
      }
    });
  } catch (error) {
    res.status(500).json(formatError(ErrorCodes.SERVER_ERROR));
  }
});

export default router;
