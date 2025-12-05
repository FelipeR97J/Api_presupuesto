import { DataTypes } from 'sequelize';
import { sequelize } from '../../config/mysql/mysqlConnect';

/**
 * MODELO: InventoryItem (Productos de Inventario)
 * 
 * Tabla que almacena los productos recurrentes del usuario con su stock
 * Utilizado en HU7-HU10: Gestión de inventario con alertas
 * 
 * RELACIÓN: Muchos items pertenecen a UN usuario (Many-to-One)
 */
export const InventoryItem = sequelize.define(
  'InventoryItem',
  {
    // Campo ID: Identificador único
    // ⚠️ RESTRICCIÓN: El ID es generado automáticamente por la BD y NUNCA puede ser modificado
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
      // Sequelize no permitirá UPDATE en este campo
    },

    // Campo UserId: Relación con la tabla users (Foreign Key)
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users', // Tabla relacionada
        key: 'id', // Columna relacionada
      },
    },
    
    // Campo Name: Nombre del producto (Ej: "Arroz", "Aceite", "Shampoo")
    name: {
      type: DataTypes.STRING,
      allowNull: false, // Obligatorio
    },
    
    // Campo Category: Categoría del producto (Ej: "alimentos", "higiene", "bebidas")
    category: {
      type: DataTypes.STRING,
      allowNull: false, // Obligatorio
    },
    
    // Campo CurrentStock: Cantidad actual en stock
    currentStock: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    
    // Campo CriticalStock: Cantidad mínima alertable (cuando llega aquí, se alerta)
    criticalStock: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 5, // Por defecto 5 unidades
    },
    
    // Campo LastRestockDate: Última fecha en que se reabasteció el producto
    lastRestockDate: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    
    // Campo AverageConsumption: Promedio de consumo mensual (aprendizaje automático)
    averageConsumption: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      defaultValue: 0,
    },
    
    // Campo SuggestedRestockQuantity: Cantidad sugerida para reabastecer (HU12)
    suggestedRestockQuantity: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },

    // Campo ID_ESTADO: Identificador del estado del item
    // Foreign key que referencia a la tabla estados
    // 1 = Activo, 2 = Inactivo
    id_estado: {
      type: DataTypes.INTEGER,
      defaultValue: 1,
      allowNull: false,
      references: {
        model: 'estados',
        key: 'id',
      },
    },
    
    // Campos de auditoría automáticos
    createdAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    updatedAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    tableName: 'inventory_items', // Nombre de la tabla en MySQL
    timestamps: true, // Habilita createdAt y updatedAt automáticos
    paranoid: true, // Habilita soft deletes (deletedAt)
    deletedAt: 'deleted_at', // Nombre de la columna en la BD
  }
);
