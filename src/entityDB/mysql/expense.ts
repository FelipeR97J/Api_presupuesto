import { DataTypes } from 'sequelize';
import { sequelize } from '../../config/mysql/mysqlConnect';

/**
 * MODELO: Expense (Gastos)
 * 
 * Tabla que almacena todos los gastos con sus categorías
 * Utilizado en HU2: Registrar gasto con categorías
 * 
 * RELACIONES:
 * - Muchos gastos pertenecen a UN usuario (Many-to-One)
 * - Muchos gastos pertenecen a UNA categoría (Many-to-One)
 */
export const Expense = sequelize.define(
  'Expense',
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

    // Campo CategoryId: Relación con expense_categories (Foreign Key)
    categoryId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'expense_categories', // Tabla relacionada
        key: 'id', // Columna relacionada
      },
    },

    // Campo DebtId: Relación con la tabla debts (Opcional, solo si es cuota)
    debtId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'debts',
        key: 'id',
      },
    },

    // Campo Amount: Monto del gasto
    amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false, // Obligatorio
    },

    // Campo Description: Descripción detallada del gasto (Ej: "Compra en supermercado")
    description: {
      type: DataTypes.STRING,
      allowNull: true, // Opcional
    },

    // Campo ID_ESTADO: Identificador del estado del gasto
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

    // Campo Date: Fecha del gasto
    date: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
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
    tableName: 'expenses', // Nombre de la tabla en MySQL
    timestamps: true, // Habilita createdAt y updatedAt automáticos
    paranoid: true, // Habilita soft deletes (deletedAt)
    deletedAt: 'deleted_at', // Nombre de la columna en la BD
  }
);
