import { DataTypes } from 'sequelize';
import { sequelize } from '../../config/mysql/mysqlConnect';

/**
 * MODELO: Debt (Deudas)
 * 
 * Tabla que agrupa gastos en cuotas (instalmentos).
 * Permite gestionar la deuda global: editar cuotas, eliminar deuda completa, etc.
 */
export const Debt = sequelize.define(
    'Debt',
    {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            allowNull: false,
        },
        // Relación con usuario
        userId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'users',
                key: 'id',
            },
        },
        // Detalles de la deuda
        creditCardId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'credit_cards',
                key: 'id',
            },
        },
        totalAmount: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false,
        },
        installments: {
            type: DataTypes.INTEGER,
            allowNull: false,
            validate: {
                min: 1
            }
        },
        description: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        startDate: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW,
        },
        // Estado (1=Activo, 2=Inactivo/Pagado/Eliminado)
        id_estado: {
            type: DataTypes.INTEGER,
            defaultValue: 1,
            allowNull: false,
            references: {
                model: 'estados',
                key: 'id',
            },
        },
    },
    {
        tableName: 'debts',
        timestamps: true,
        paranoid: true, // Soft delete
        deletedAt: 'deleted_at',
    }
);
