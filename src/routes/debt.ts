import express from 'express';
import { sequelize } from '../config/mysql/mysqlConnect';
import { Debt } from '../entityDB/mysql/debt';
import { Expense } from '../entityDB/mysql/expense';
import { CreditCard } from '../entityDB/mysql/creditCard';
import { Bank } from '../entityDB/mysql/bank';
import { ExpenseCategory } from '../entityDB/mysql/expenseCategory';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { ErrorCodes, formatError } from '../utils/errorCodes';

const router = express.Router();

/**
 * CREAR DEUDA
 * POST /debt
 * Body: { bank, card, totalAmount, installments, categoryId, description, startDate? }
 */
router.post('/', authMiddleware, async (req: AuthRequest, res) => {
    const t = await sequelize.transaction();
    try {
        const { creditCardId, totalAmount, installments, categoryId, description, startDate } = req.body;

        if (!req.user) {
            await t.rollback();
            return res.status(401).json(formatError(ErrorCodes.AUTH.TOKEN_INVALID));
        }

        // Validar campos
        if (!creditCardId || !totalAmount || !installments || !categoryId) {
            await t.rollback();
            return res.status(400).json({ error: 'Missing required fields' });
        }

        // Obtener detalles de la tarjeta (y su banco) para la descripción
        const creditCard = await CreditCard.findOne({
            where: { id: creditCardId, userId: req.user.id }, // Asegurar que sea del usuario
            include: [{ model: Bank, as: 'bank' }]
        });

        if (!creditCard) {
            await t.rollback();
            return res.status(404).json({ error: 'Credit Card not found' });
        }

        const cardName = creditCard.get('name');
        const bankName = creditCard.get('bank') ? (creditCard as any).bank.name : 'Banco';

        // Calcular monto cuota
        const installmentAmount = totalAmount / installments;
        const initialDate = startDate ? new Date(startDate) : new Date();

        // 1. Crear la Deuda padre
        const debt = await Debt.create({
            userId: req.user.id,
            creditCardId,
            totalAmount,
            installments,
            description,
            startDate: initialDate,
            id_estado: 1
        }, { transaction: t });

        // 2. Crear las cuotas (Expenses)
        const expensesToCreate = [];
        for (let i = 0; i < installments; i++) {
            const currentDate = new Date(initialDate);
            currentDate.setMonth(currentDate.getMonth() + i);

            // Formato: "Playstation 5 - Banco Estado - Cuenta Pro - Cuota 1/6"
            const detailDescription = `${description || 'Deuda'} - ${bankName} - ${cardName} - Cuota ${i + 1}/${installments}`;

            expensesToCreate.push({
                userId: req.user.id,
                categoryId,
                debtId: (debt as any).id, // Vincular a la deuda
                amount: installmentAmount,
                description: detailDescription,
                date: currentDate,
                id_estado: 1
            });
        }

        await Expense.bulkCreate(expensesToCreate, { transaction: t });

        await t.commit();

        // Retornar deuda con sus detalles
        const createdDebt = await Debt.findByPk((debt as any).id, {
            include: [
                { model: Expense, as: 'expenses' },
                {
                    model: CreditCard,
                    as: 'creditCard',
                    include: [{ model: Bank, as: 'bank' }]
                }
            ]
        });

        res.status(201).json(createdDebt);

    } catch (error) {
        await t.rollback();
        console.error('Error creating debt:', error);
        res.status(500).json(formatError(ErrorCodes.SERVER_ERROR));
    }
});

/**
 * LISTAR DEUDAS
 * GET /debt
 * Query: page, limit, year, month (opcional para filtro)
 */
router.get('/', authMiddleware, async (req: AuthRequest, res) => {
    try {
        if (!req.user) return res.status(401).json(formatError(ErrorCodes.AUTH.TOKEN_INVALID));

        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;
        const year = parseInt(req.query.year as string);
        const month = parseInt(req.query.month as string);

        const offset = (page - 1) * limit;

        const whereClause: any = { userId: req.user.id };

        // Filtro por fecha (Mes y Año) de inicio de la deuda
        if (year && month) {
            const startDate = new Date(year, month - 1, 1);
            const endDate = new Date(year, month, 0, 23, 59, 59); // Último día del mes

            // Usamos Op de Sequelize (necesitamos required dentro o fuera)
            const { Op } = require('sequelize');
            whereClause.startDate = {
                [Op.between]: [startDate, endDate]
            };
        }

        const { count, rows } = await Debt.findAndCountAll({
            where: whereClause,
            include: [
                {
                    model: CreditCard,
                    as: 'creditCard',
                    attributes: ['id', 'name'],
                    include: [{
                        model: Bank,
                        as: 'bank',
                        attributes: ['id', 'name']
                    }]
                },
                {
                    model: Expense,
                    as: 'expenses',
                    attributes: ['categoryId'],
                    limit: 1, // Solo necesitamos uno para sacar la categoría
                    include: [{
                        model: ExpenseCategory,
                        as: 'category',
                        attributes: ['id', 'name', 'id_estado']
                    }]
                }
            ],
            order: [['createdAt', 'DESC']],
            limit,
            offset,
            distinct: true
        });

        // Mapear resultados para subir 'category' a la raíz
        const data = rows.map(debt => {
            const debtJSON = debt.toJSON();
            const firstExpense = (debtJSON as any).expenses?.[0];
            const category = firstExpense?.category || null;
            const categoryId = firstExpense?.categoryId || null;

            // Limpiamos expenses del listado principal para no ensuciar
            delete (debtJSON as any).expenses;

            return {
                ...debtJSON,
                categoryId,
                category
            };
        });

        res.status(200).json({
            data,
            pagination: {
                page,
                limit,
                total: count,
                totalPages: Math.ceil(count / limit)
            }
        });

    } catch (error) {
        console.error('Error getting debts:', error);
        res.status(500).json(formatError(ErrorCodes.SERVER_ERROR));
    }
});

/**
 * OBTENER UNA DEUDA (CON DETALLE DE CUOTAS)
 * GET /debt/:id
 */
router.get('/:id', authMiddleware, async (req: AuthRequest, res) => {
    try {
        if (!req.user) return res.status(401).json(formatError(ErrorCodes.AUTH.TOKEN_INVALID));

        const debt = await Debt.findOne({
            where: { id: req.params.id, userId: req.user.id },
            include: [
                {
                    model: Expense,
                    as: 'expenses',
                    attributes: ['id', 'amount', 'date', 'description', 'id_estado', 'categoryId'],
                    include: [{ model: ExpenseCategory, as: 'category' }]
                },
                {
                    model: CreditCard,
                    as: 'creditCard',
                    attributes: ['id', 'name'],
                    include: [{
                        model: Bank,
                        as: 'bank',
                        attributes: ['id', 'name']
                    }]
                }
            ],
            order: [[{ model: Expense, as: 'expenses' }, 'date', 'ASC']]
        });

        if (!debt) {
            return res.status(404).json({ error: 'Debt not found' });
        }

        // Extraer category completa del primer gasto (todos comparten la misma categoría en una deuda)
        const debtJSON = debt.toJSON();
        const firstExpense = (debtJSON as any).expenses?.[0];
        const category = firstExpense?.category || null;
        const categoryId = firstExpense?.categoryId || null;

        res.status(200).json({ ...debtJSON, categoryId, category });

    } catch (error) {
        console.error('Error getting debt detail:', error);
        res.status(500).json(formatError(ErrorCodes.SERVER_ERROR));
    }
});

/**
 * EDITAR DEUDA
 * PUT /debt/:id
 * Body: { totalAmount?, installments?, startDate?, bank?, card?, description? }
 * Si cambia monto, cuotas o fecha, se REGENERAN los gastos.
 */
router.put('/:id', authMiddleware, async (req: AuthRequest, res) => {
    const t = await sequelize.transaction();
    try {
        const { totalAmount, installments, startDate, creditCardId, description, categoryId } = req.body;
        const debtId = req.params.id;

        const debt = await Debt.findOne({
            where: { id: debtId, userId: req.user?.id },
            include: [{ model: CreditCard, as: 'creditCard', include: ['bank'] }]
        });

        if (!debt) {
            await t.rollback();
            return res.status(404).json({ error: 'Debt not found' });
        }

        // Detectar si se requiere regeneración de cuotas
        // Si cambia la tarjeta, también queremos regenerar para actualizar descripciones (banco/tarjeta)
        const needsRegeneration =
            (totalAmount && totalAmount != debt.get('totalAmount')) ||
            (installments && installments != debt.get('installments')) ||
            (startDate && new Date(startDate).getTime() != new Date(debt.get('startDate') as Date).getTime()) ||
            (creditCardId && creditCardId != debt.get('creditCardId'));

        // Si cambiamos tarjeta, verificar que existe
        if (creditCardId && creditCardId != debt.get('creditCardId')) {
            const newCard = await CreditCard.findOne({ where: { id: creditCardId, userId: req.user?.id } });
            if (!newCard) {
                await t.rollback();
                return res.status(404).json({ error: 'New Credit Card not found' });
            }
        }

        // Actualizar datos de la Deuda
        await debt.update({
            creditCardId: creditCardId || debt.get('creditCardId'),
            description: description || debt.get('description'),
            totalAmount: totalAmount || debt.get('totalAmount'),
            installments: installments || debt.get('installments'),
            startDate: startDate || debt.get('startDate')
        }, { transaction: t });

        if (needsRegeneration) {
            // 1. Recargar deuda con nueva tarjeta/info
            await debt.reload({ include: [{ model: CreditCard, as: 'creditCard', include: ['bank'] }], transaction: t });

            const cardName = (debt.get('creditCard') as any)?.name;
            const bankName = (debt.get('creditCard') as any)?.bank ? (debt.get('creditCard') as any).bank.name : 'Banco';

            // 2. Eliminar (soft delete) gastos antiguos vinculados
            await Expense.destroy({
                where: { debtId: debt.get('id') },
                transaction: t
            });

            // 3. Calcular nuevos valores
            const newTotal = Number(debt.get('totalAmount'));
            const newInstallments = Number(debt.get('installments'));
            const newStart = new Date(debt.get('startDate') as Date);

            let targetCategoryId = categoryId;
            if (!targetCategoryId) {
                const oldExpense = await Expense.findOne({ where: { debtId: debt.get('id') }, paranoid: false });
                targetCategoryId = oldExpense ? oldExpense.get('categoryId') : 1;
            }

            const installmentAmount = newTotal / newInstallments;

            // 4. Crear nuevas cuotas
            const expensesToCreate = [];
            for (let i = 0; i < newInstallments; i++) {
                const currentDate = new Date(newStart);
                currentDate.setMonth(currentDate.getMonth() + i);

                const detailDescription = `${debt.get('description')} - ${bankName} - ${cardName} - Cuota ${i + 1}/${newInstallments}`;

                expensesToCreate.push({
                    userId: req.user?.id,
                    categoryId: targetCategoryId,
                    debtId: debt.get('id'),
                    amount: installmentAmount,
                    description: detailDescription,
                    date: currentDate,
                    id_estado: 1
                });
            }
            await Expense.bulkCreate(expensesToCreate, { transaction: t });
        } else if (description) {
            // Si solo cambió descripción, no regeneramos TODO, pero quizás deberíamos actualizar descripciones... 
            // Por simplicidad, asumimos que si no regenera, no toca expenses.
        }

        await t.commit();

        // Retornar actualizado
        const updatedDebt = await Debt.findByPk(debtId, {
            include: [
                { model: Expense, as: 'expenses' },
                { model: CreditCard, as: 'creditCard', include: ['bank'] }
            ]
        });

        res.status(200).json(updatedDebt);

    } catch (error) {
        await t.rollback();
        console.error('Error updating debt:', error);
        res.status(500).json(formatError(ErrorCodes.SERVER_ERROR));
    }
});

/**
 * ELIMINAR DEUDA
 * DELETE /debt/:id
 * Elimina la deuda y todas sus cuotas asociadas.
 */
router.delete('/:id', authMiddleware, async (req: AuthRequest, res) => {
    const t = await sequelize.transaction();
    try {
        const debt = await Debt.findOne({ where: { id: req.params.id, userId: req.user?.id } });

        if (!debt) {
            await t.rollback();
            return res.status(404).json({ error: 'Debt not found' });
        }

        // Al eliminar la deuda, Sequelize (paranoid) hará soft delete
        await debt.destroy({ transaction: t });

        // También eliminamos explícitamente los expenses vinculados (aunque podríamos usar hooks, es más seguro explícito aqui)
        await Expense.destroy({
            where: { debtId: debt.get('id') },
            transaction: t
        });

        await t.commit();
        res.status(200).json({ message: 'Debt and associated expenses deleted successfully' });

    } catch (error) {
        await t.rollback();
        console.error('Error deleting debt:', error);
        res.status(500).json(formatError(ErrorCodes.SERVER_ERROR));
    }
});

export default router;
