import { DataTypes } from 'sequelize';
import { sequelize } from '../../config/mysql/mysqlConnect';

/**
 * MODELO: UserRole (Tabla Transaccional)
 * 
 * Tabla intermedia que gestiona la relación entre Usuarios y Roles
 * Proporciona auditoría completa de cambios de roles
 * 
 * Un usuario puede tener múltiples roles simultáneamente
 * Cada asignación/revocación de rol queda registrada con:
 * - Quién la ejecutó (createdBy, revokedBy)
 * - Cuándo ocurrió (createdAt, revokedAt)
 * 
 * Ejemplo:
 * - Usuario 5 obtiene role 1 (admin) por usuario 1 en 2025-12-03 10:30
 * - Usuario 5 pierde role 1 por usuario 1 en 2025-12-03 11:00
 * - Historial completo disponible para auditoría
 */
export const UserRole = sequelize.define(
  'UserRole',
  {
    // Campo ID: Identificador único de la asignación de rol
    // ⚠️ RESTRICCIÓN: El ID es generado automáticamente por la BD y NUNCA puede ser modificado
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
      // Sequelize no permitirá UPDATE en este campo
    },

    // Campo UserID: Referencia al usuario que tiene el rol
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
      onDelete: 'CASCADE',
    },

    // Campo RoleID: Referencia al rol asignado
    roleId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'roles',
        key: 'id',
      },
      onDelete: 'CASCADE',
    },

    // Campo CreatedAt: Cuándo se asignó el rol
    createdAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      allowNull: false,
    },

    // Campo CreatedBy: ID del administrador que asignó el rol
    // NULL si fue asignado automáticamente en el registro
    createdBy: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id',
      },
      onDelete: 'SET NULL',
    },

    // Campo RevokedAt: Cuándo se revocó/quitó el rol
    // NULL si el rol sigue vigente
    revokedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },

    // Campo RevokedBy: ID del administrador que revocó el rol
    // NULL si el rol sigue vigente
    revokedBy: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id',
      },
      onDelete: 'SET NULL',
    },

    // Campo IsActive: Indica si el rol está actualmente asignado
    // true = rol vigente, false = rol revocado pero registrado en historial
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      allowNull: false,
    },

    // Campo UpdatedAt: Última modificación
    updatedAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    tableName: 'user_roles',
    timestamps: true,
    // No usar paranoid porque queremos soft delete manual con revokedAt
  }
);
