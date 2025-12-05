import { DataTypes } from 'sequelize';
import { sequelize } from '../../config/mysql/mysqlConnect';

export const Instrument = sequelize.define(
  'Instrument',
  {
    // ⚠️ RESTRICCIÓN: El ID es generado automáticamente por la BD y NUNCA puede ser modificado
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
      // Sequelize no permitirá UPDATE en este campo
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    type: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    description: {
      type: DataTypes.TEXT,
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
    tableName: 'instruments',
    timestamps: true,
  }
);
