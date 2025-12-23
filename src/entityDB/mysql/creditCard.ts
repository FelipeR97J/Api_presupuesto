import { DataTypes } from 'sequelize';
import { sequelize } from '../../config/mysql/mysqlConnect';

export const CreditCard = sequelize.define(
    'CreditCard',
    {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            allowNull: false,
        },
        userId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'users',
                key: 'id',
            },
        },
        bankId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'banks',
                key: 'id',
            },
        },
        name: {
            type: DataTypes.STRING,
            allowNull: false,
        },
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
        tableName: 'credit_cards',
        timestamps: true,
        paranoid: true,
        deletedAt: 'deletedAt',
    }
);
