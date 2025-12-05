import { DataTypes } from 'sequelize';
import { sequelize } from '../../config/mysql/mysqlConnect';

/**
 * MODELO: ExpenseCategory
 * 
 * Tabla que almacena las categorías de gastos disponibles
 * Las categorías son predefinidas pero pueden ser administradas
 * 
 * RELACIÓN: Una categoría tiene MUCHOS gastos (One-to-Many)
 */
export const ExpenseCategory = sequelize.define(
  'ExpenseCategory',
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

    // Campo Name: Nombre de la categoría (ej: "Alimentación", "Transporte", "Servicios", etc)
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true, // No puede haber dos categorías con el mismo nombre
    },

    // Campo Description: Descripción de la categoría
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },

    // Campo ID_ESTADO: Identificador del estado de la categoría
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

    // Campo IsSystem: true = categoría del sistema (no se puede eliminar)
    // false = categoría personalizada (usuario puede eliminar)
    isSystem: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },

    // Campo CreatedBy: ID del usuario que creó la categoría
    // null = categoría del sistema
    createdBy: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'users',
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
    tableName: 'expense_categories', // Nombre de la tabla en MySQL
    timestamps: true, // Habilita createdAt y updatedAt automáticos
    paranoid: true, // Habilita soft deletes (deletedAt)
    deletedAt: 'deleted_at', // Nombre de la columna en la BD
  }
);
