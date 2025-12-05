import { DataTypes } from 'sequelize';
import { sequelize } from '../../config/mysql/mysqlConnect';

/**
 * MODELO: Role (Roles del Sistema)
 * 
 * Tabla de catálogo que almacena los roles disponibles en el sistema
 * Roles predefinidos: 'admin', 'user'
 * 
 * Relación: Muchos-a-Muchos con User a través de UserRole
 */
export const Role = sequelize.define(
  'Role',
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

    // Campo Name: Nombre único del rol
    // Valores: 'admin', 'user', 'moderator', etc
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },

    // Campo Description: Descripción del rol y sus responsabilidades
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },

    // Campo Permissions: JSON con lista de permisos específicos
    // Ejemplo: { 
    //   "canManageUsers": true, 
    //   "canViewStats": true, 
    //   "canEditCategories": true 
    // }
    permissions: {
      type: DataTypes.JSON,
      defaultValue: {},
      allowNull: false,
    },

    // Campo ID_ESTADO: Identificador del estado del rol
    // Foreign key que referencia a la tabla estados
    // 0 = Activo, 1 = Inactivo
    id_estado: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
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
    tableName: 'roles',
    timestamps: true,
    paranoid: true, // Habilita soft deletes (deletedAt)
    deletedAt: 'deleted_at', // Nombre de la columna en la BD
  }
);
