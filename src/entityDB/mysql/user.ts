import { DataTypes } from 'sequelize';
import { sequelize } from '../../config/mysql/mysqlConnect';

/**
 * MODELO: User (Usuarios)
 * 
 * Tabla que almacena los usuarios de la aplicación
 * Incluye email, contraseña encriptada y datos básicos
 */
export const User = sequelize.define(
  'User',
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

    // Campo Email: Email único del usuario
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true, // No se puede repetir
      validate: {
        isEmail: true, // Debe ser un email válido
      },
    },

    // Campo Password: Contraseña encriptada con bcrypt
    password: {
      type: DataTypes.STRING,
      allowNull: false,
    },

    // Campo FirstName: Nombre del usuario
    firstName: {
      type: DataTypes.STRING,
      allowNull: false,
    },

    // Campo PaternalLastName: Apellido Paterno
    paternalLastName: {
      type: DataTypes.STRING,
      allowNull: false,
    },

    // Campo MaternalLastName: Apellido Materno
    maternalLastName: {
      type: DataTypes.STRING,
      allowNull: true,
    },

    // Campo RUT: RUT chileno (Rol Único Tributario)
    // Formato: XX.XXX.XXX-K (ej: 30.123.456-K)
    rut: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true, // No se puede repetir
      validate: {
        len: [8, 20], // Mínimo 8 caracteres, máximo 20 (considerando formato)
      },
    },

    // Campo BirthDate: Fecha de nacimiento del usuario (YYYY-MM-DD)
    birthDate: {
      type: DataTypes.DATE,
      allowNull: true,
      validate: {
        isDate: true, // Debe ser una fecha válida
        isAfter: '1900-01-01', // Mayor que 1900
        isBefore: new Date().toISOString(), // Menor que hoy
      },
    },

    // Campo PhoneNumber: Número de teléfono del usuario (opcional)
    phoneNumber: {
      type: DataTypes.STRING,
      allowNull: true,
      validate: {
        len: [7, 20], // Entre 7 y 20 caracteres (incluyendo +, -, espacios)
      },
    },

    // Campo ID_ESTADO: Identificador del estado del usuario
    // Foreign key que referencia a la tabla estados
    // 1 = Activo (puede hacer login)
    // 2 = Inactivo (suspendido)
    id_estado: {
      type: DataTypes.INTEGER,
      defaultValue: 1,
      allowNull: false,
      references: {
        model: 'estados',
        key: 'id',
      },
    },

    // Campo LastLoginAt: Última vez que el usuario hizo login
    // Se actualiza en cada login exitoso
    // NULL si nunca ha hecho login o si se elimina la cuenta
    lastLoginAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },

    // Campo ID_ROL: Identificador del rol del usuario
    // Foreign key que referencia a la tabla roles
    // Un usuario tiene EXACTAMENTE UN rol
    id_rol: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'roles', // Nombre de la tabla referenciada
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
    tableName: 'users', // Nombre de la tabla en MySQL
    timestamps: true,
    paranoid: true, // Activar soft delete (crea automáticamente campo deletedAt)
    deletedAt: 'deleted_at', // Nombre de la columna en la BD
  }
);
