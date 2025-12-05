import { DataTypes } from 'sequelize';
import { sequelize } from '../../config/mysql/mysqlConnect';

/**
 * MODELO: Income (Ingresos)
 * 
 * Tabla que almacena todos los ingresos registrados por el usuario
 * Utilizado en HU1: Registrar ingreso
 * 
 * RELACIONES:
 * - Muchos ingresos pertenecen a UN usuario (Many-to-One)
 * - Muchos ingresos pertenecen a UNA categoría (Many-to-One)
 */
export const Income = sequelize.define(
  'Income',
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

    // Campo CategoryId: Relación con income_categories (Foreign Key)
    categoryId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'income_categories', // Tabla relacionada
        key: 'id', // Columna relacionada
      },
    },
    
    // Campo Amount: Monto del ingreso
    amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false, // Obligatorio
    },
    
    // Campo Description: Descripción del ingreso (Ej: "Salario", "Bonus")
    description: {
      type: DataTypes.STRING,
      allowNull: true, // Opcional
    },

    // Campo ID_ESTADO: Identificador del estado del ingreso
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
    
    // Campo Date: Fecha del ingreso
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
    tableName: 'incomes', // Nombre de la tabla en MySQL
    timestamps: true, // Habilita createdAt y updatedAt automáticos
    paranoid: true, // Habilita soft deletes (deletedAt)
    deletedAt: 'deleted_at', // Nombre de la columna en la BD
  }
);
