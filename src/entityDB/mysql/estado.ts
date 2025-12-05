import { DataTypes } from 'sequelize';
import { sequelize } from '../../config/mysql/mysqlConnect';

/**
 * MODELO: Estado (Estados del Sistema)
 * 
 * Tabla centralizada que almacena los estados disponibles
 * Todos los registros activos/inactivos referencia esta tabla
 */
export const Estado = sequelize.define(
  'Estado',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
    },

    name: {
      type: DataTypes.INTEGER,
      allowNull: false,
      unique: true,
      comment: '0 = Activo, 1 = Inactivo',
    },

    description: {
      type: DataTypes.STRING,
      allowNull: true,
    },

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
    tableName: 'estados',
    timestamps: true,
  }
);
