/**
 * ASOCIACIONES DE SEQUELIZE
 * 
 * Este archivo define todas las relaciones entre modelos
 * Se ejecuta después de que todos los modelos están definidos
 */

/**
 * RELACIONES:
 * 
 * 1. UN usuario tiene MUCHOS ingresos (One-to-Many)
 *    User.hasMany(Income) 
 *    Income.belongsTo(User)
 * 
 * 2. UN usuario tiene MUCHOS gastos (One-to-Many)
 *    User.hasMany(Expense)
 *    Expense.belongsTo(User)
 * 
 * 3. UN usuario tiene MUCHOS items de inventario (One-to-Many)
 *    User.hasMany(InventoryItem)
 *    InventoryItem.belongsTo(User)
 */

export function setupAssociations() {
  // Importar modelos dentro de la función para evitar dependencia circular
  const { User } = require('../entityDB/mysql/user');
  const { Income } = require('../entityDB/mysql/income');
  const { IncomeCategory } = require('../entityDB/mysql/incomeCategory');
  const { Expense } = require('../entityDB/mysql/expense');
  const { ExpenseCategory } = require('../entityDB/mysql/expenseCategory');
  const { InventoryItem } = require('../entityDB/mysql/inventoryItem');
  const { Role } = require('../entityDB/mysql/role');
  const { Estado } = require('../entityDB/mysql/estado');
  
  // ==================== ESTADOS (Relación One-to-Many) ====================
  
  /**
   * Relación: User belongsTo Estado
   * Un usuario tiene EXACTAMENTE UN estado (activo/inactivo)
   */
  (User as any).belongsTo(Estado, {
    foreignKey: 'id_estado',
    as: 'estado',
  });

  /**
   * Relación: Role belongsTo Estado
   * Un rol tiene EXACTAMENTE UN estado
   */
  (Role as any).belongsTo(Estado, {
    foreignKey: 'id_estado',
    as: 'estado',
  });

  /**
   * Relación: Income belongsTo Estado
   * Un ingreso tiene EXACTAMENTE UN estado
   */
  (Income as any).belongsTo(Estado, {
    foreignKey: 'id_estado',
    as: 'estado',
  });

  /**
   * Relación: Expense belongsTo Estado
   * Un gasto tiene EXACTAMENTE UN estado
   */
  (Expense as any).belongsTo(Estado, {
    foreignKey: 'id_estado',
    as: 'estado',
  });

  /**
   * Relación: IncomeCategory belongsTo Estado
   * Una categoría de ingreso tiene EXACTAMENTE UN estado
   */
  (IncomeCategory as any).belongsTo(Estado, {
    foreignKey: 'id_estado',
    as: 'estado',
  });

  /**
   * Relación: ExpenseCategory belongsTo Estado
   * Una categoría de gasto tiene EXACTAMENTE UN estado
   */
  (ExpenseCategory as any).belongsTo(Estado, {
    foreignKey: 'id_estado',
    as: 'estado',
  });

  /**
   * Relación: InventoryItem belongsTo Estado
   * Un item de inventario tiene EXACTAMENTE UN estado
   */
  (InventoryItem as any).belongsTo(Estado, {
    foreignKey: 'id_estado',
    as: 'estado',
  });

  // ==================== ROLES (Relación One-to-Many) ====================
  
  /**
   * Relación: User belongsTo Role
   * Un usuario tiene EXACTAMENTE UN rol (almacenado en id_rol)
   */
  (User as any).belongsTo(Role, {
    foreignKey: 'id_rol',
    as: 'role',
  });

  /**
   * Relación: Role hasMany User
   * Un rol puede estar asignado a múltiples usuarios
   */
  (Role as any).hasMany(User, {
    foreignKey: 'id_rol',
    as: 'users',
  });
  
  // ==================== INGRESOS ====================
  
  /**
   * Relación: User hasMany Income
   * Un usuario puede tener múltiples ingresos
   */
  (User as any).hasMany(Income, {
    foreignKey: 'userId', // Clave foránea en Income
    as: 'incomes', // Alias para acceder: user.getIncomes()
    onDelete: 'CASCADE', // Si se elimina usuario, se eliminan sus ingresos
  });

  /**
   * Relación: Income belongsTo User
   * Un ingreso pertenece a un usuario
   */
  (Income as any).belongsTo(User, {
    foreignKey: 'userId',
    as: 'user', // Alias para acceder: income.getUser()
  });

  /**
   * Relación: IncomeCategory hasMany Income
   * Una categoría puede tener múltiples ingresos
   */
  (IncomeCategory as any).hasMany(Income, {
    foreignKey: 'categoryId',
    as: 'incomes',
    onDelete: 'RESTRICT', // No permite eliminar categoría si tiene ingresos asociados
  });

  /**
   * Relación: Income belongsTo IncomeCategory
   * Un ingreso pertenece a una categoría
   */
  (Income as any).belongsTo(IncomeCategory, {
    foreignKey: 'categoryId',
    as: 'category', // Alias para acceder: income.getCategory()
  });

  // ==================== GASTOS ====================

  /**
   * Relación: User hasMany Expense
   * Un usuario puede tener múltiples gastos
   */
  (User as any).hasMany(Expense, {
    foreignKey: 'userId',
    as: 'expenses',
    onDelete: 'CASCADE',
  });

  /**
   * Relación: Expense belongsTo User
   * Un gasto pertenece a un usuario
   */
  (Expense as any).belongsTo(User, {
    foreignKey: 'userId',
    as: 'user',
  });

  /**
   * Relación: ExpenseCategory hasMany Expense
   * Una categoría puede tener múltiples gastos
   */
  (ExpenseCategory as any).hasMany(Expense, {
    foreignKey: 'categoryId',
    as: 'expenses',
    onDelete: 'RESTRICT', // No permite eliminar categoría si tiene gastos asociados
  });

  /**
   * Relación: Expense belongsTo ExpenseCategory
   * Un gasto pertenece a una categoría
   */
  (Expense as any).belongsTo(ExpenseCategory, {
    foreignKey: 'categoryId',
    as: 'category', // Alias para acceder: expense.getCategory()
  });

  // ==================== INVENTARIO ====================

  /**
   * Relación: User hasMany InventoryItem
   * Un usuario puede tener múltiples items de inventario
   */
  (User as any).hasMany(InventoryItem, {
    foreignKey: 'userId',
    as: 'inventoryItems',
    onDelete: 'CASCADE',
  });

  /**
   * Relación: InventoryItem belongsTo User
   * Un item de inventario pertenece a un usuario
   */
  (InventoryItem as any).belongsTo(User, {
    foreignKey: 'userId',
    as: 'user',
  });
}
