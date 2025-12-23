import { DataTypes } from 'sequelize';
import { sequelize } from '../../config/mysql/mysqlConnect';

export const Bank = sequelize.define(
    'Bank',
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
        tableName: 'banks',
        timestamps: true,
        paranoid: true,
        deletedAt: 'deletedAt',
    }
);
