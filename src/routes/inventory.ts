import express from 'express';
import { InventoryItem } from '../entityDB/mysql/inventoryItem';
import { sequelize } from '../config/mysql/mysqlConnect';
import { QueryTypes, Op } from 'sequelize';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = express.Router();

/**
 * HU7 - Registrar producto de consumo mensual
 * POST /inventory/
 * Permite registrar productos que se compran regularmente para controlar su inventario
 * Body: { name: string, category: string, currentStock?: number, criticalStock?: number }
 * 
 * REQUIERE AUTENTICACIÓN (token JWT)
 */
router.post('/', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { name, category, currentStock, criticalStock } = req.body;

    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    
    // Validar datos requeridos
    if (!name || !category) {
      return res.status(400).json({ error: 'Name and category are required' });
    }
    
    // Crear nuevo item de inventario con userId del usuario autenticado
    const item = await InventoryItem.create({
      userId: req.user.id, // Asociar al usuario autenticado
      name,
      category,
      currentStock: currentStock || 0,
      criticalStock: criticalStock || 5, // Stock mínimo por defecto
    });
    res.status(201).json(item);
  } catch (error) {
    res.status(500).json({ error: 'Error creating inventory item' });
  }
});

/**
 * HU8 - Modificar stock actual
 * PATCH /inventory/:id/stock
 * Actualiza la cantidad actual en stock de un producto
 * Body: { currentStock: number }
 * SOFT DELETE: Solo permite actualizar stocks si el item está activo (id_estado = 1)
 * 
 * REQUIERE AUTENTICACIÓN (token JWT)
 */
router.patch('/:id/stock', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { currentStock } = req.body;

    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    
    // Validar que se proporcione el stock
    if (currentStock === undefined) {
      return res.status(400).json({ error: 'Current stock is required' });
    }
    
    // Buscar el item por ID y que pertenezca al usuario
    // paranoid: true excluye automáticamente items eliminados (deletedAt != null)
    const item = await InventoryItem.findOne({
      where: {
        id: req.params.id,
        userId: req.user.id, // Verificar que pertenece al usuario
      },
    });
    
    if (!item) {
      return res.status(404).json({ error: 'Item not found or is inactive' });
    }
    
    // Actualizar el stock y registrar la fecha de reabastecimiento
    (item as any).currentStock = currentStock;
    (item as any).lastRestockDate = new Date();
    await item.save();
    res.status(200).json(item);
  } catch (error) {
    res.status(500).json({ error: 'Error updating stock' });
  }
});

/**
 * HU9 - Ver inventario por categoría
 * GET /inventory/category/:category
 * Retorna todos los productos de una categoría específica (solo del usuario)
 * SOFT DELETE: Solo retorna items activos (id_estado = 1)
 * 
 * REQUIERE AUTENTICACIÓN (token JWT)
 */
router.get('/category/:category', authMiddleware, async (req: AuthRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    // Buscar items donde la categoría coincida y pertenezcan al usuario
    // paranoid: true excluye automáticamente items eliminados (deletedAt != null)
    const items = await InventoryItem.findAll({
      where: {
        category: req.params.category,
        userId: req.user.id, // Solo del usuario autenticado
      },
      order: [['createdAt', 'DESC']],
    });
    res.status(200).json(items);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching inventory items' });
  }
});

/**
 * HU10 - Alertas de stock crítico
 * GET /inventory/alerts/critical
 * Retorna los productos cuyo stock actual es menor o igual al stock crítico
 * Útil para alertar al usuario que debe reabastecer (solo del usuario)
 * SOFT DELETE: Solo incluye items activos (isActive = true)
 * 
 * REQUIERE AUTENTICACIÓN (token JWT)
 */
router.get('/alerts/critical', authMiddleware, async (req: AuthRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    // Buscar items donde currentStock <= criticalStock y pertenezcan al usuario
    // paranoid: true excluye automáticamente items eliminados (deletedAt != null)
    const criticalItems = await InventoryItem.findAll({
      where: {
        userId: req.user.id, // Solo del usuario autenticado
        [Op.and]: [
          sequelize.where(
            sequelize.col('currentStock'),
            Op.lte, // menor o igual que
            sequelize.col('criticalStock')
          ),
        ],
      },
      order: [['currentStock', 'ASC']], // Ordenar por stock más bajo primero
    });
    res.status(200).json(criticalItems);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching critical alerts' });
  }
});

/**
 * Obtener todo el inventario del usuario autenticado
 * GET /inventory/
 * Retorna una lista de todos los productos en el inventario del usuario
 * SOFT DELETE: Solo retorna items activos (isActive = true)
 * 
 * REQUIERE AUTENTICACIÓN (token JWT)
 */
router.get('/', authMiddleware, async (req: AuthRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    // Buscar solo items del usuario autenticado
    // paranoid: true excluye automáticamente items eliminados (deletedAt != null)
    const items = await InventoryItem.findAll({
      where: { 
        userId: req.user.id,
      },
      order: [['id_estado', 'ASC'], ['createdAt', 'DESC']], // Activos primero, luego por fecha
    });
    res.status(200).json(items);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching inventory items' });
  }
});

/**
 * Obtener item de inventario por ID
 * GET /inventory/:id
 * Retorna un producto específico del inventario por su ID (solo si pertenece al usuario)
 * Muestra tanto activos como inactivos (paranoid excluye eliminados)
 * 
 * REQUIERE AUTENTICACIÓN (token JWT)
 */
router.get('/:id', authMiddleware, async (req: AuthRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const item = await InventoryItem.findOne({
      where: {
        id: req.params.id,
        userId: req.user.id, // Verificar que pertenece al usuario
      },
    });

    if (!item) {
      return res.status(404).json({ error: 'Item not found or has been deleted' });
    }
    res.status(200).json(item);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching inventory item' });
  }
});

/**
 * Eliminar (soft delete) item de inventario
 * DELETE /inventory/:id
 * Marca un producto como inactivo (id_estado = 2)
 * SOFT DELETE: El registro no se elimina físicamente, solo se marca como inactivo
 * Los datos se conservan permanentemente en la BD para auditoría
 * 
 * REQUIERE AUTENTICACIÓN (token JWT)
 */
router.delete('/:id', authMiddleware, async (req: AuthRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const item = await InventoryItem.findOne({
      where: {
        id: req.params.id,
        userId: req.user.id, // Verificar que pertenece al usuario
      },
    });

    if (!item) {
      return res.status(404).json({ error: 'Item not found or has been deleted' });
    }

    // SOFT DELETE REAL: Usando deletedAt
    await item.destroy();

    res.status(200).json({ 
      message: 'Item deleted successfully',
      id: req.params.id,
      deletedAt: new Date()
    });
  } catch (error) {
    res.status(500).json({ error: 'Error deleting inventory item' });
  }
});

/**
 * Actualizar (PATCH) item de inventario
 * PATCH /inventory/:id
 * Permite actualizar nombre, categoría, stocks, etc.
 * SOFT DELETE: Valida que el item esté activo (id_estado = 1) antes de actualizar
 * 
 * Body: { name?: string, category?: string, currentStock?: number, criticalStock?: number }
 * REQUIERE AUTENTICACIÓN (token JWT)
 */
router.patch('/:id', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { name, category, currentStock, criticalStock } = req.body;

    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const item = await InventoryItem.findOne({
      where: {
        id: req.params.id,
        userId: req.user.id,
      },
    });

    if (!item) {
      return res.status(404).json({ error: 'Item not found or has been deleted' });
    }

    // Actualizar solo los campos proporcionados
    if (name !== undefined) (item as any).name = name;
    if (category !== undefined) (item as any).category = category;
    if (currentStock !== undefined) (item as any).currentStock = currentStock;
    if (criticalStock !== undefined) (item as any).criticalStock = criticalStock;

    await item.save();
    res.status(200).json(item);
  } catch (error) {
    res.status(500).json({ error: 'Error updating inventory item' });
  }
});

export default router;
