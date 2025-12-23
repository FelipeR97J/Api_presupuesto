import express from 'express';
import { Op, Sequelize } from 'sequelize';
import { sequelize } from '../config/mysql/mysqlConnect';
import { Income } from '../entityDB/mysql/income';
import { Expense } from '../entityDB/mysql/expense';
import { Debt } from '../entityDB/mysql/debt';
import { ExpenseCategory } from '../entityDB/mysql/expenseCategory';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { ErrorCodes, formatError } from '../utils/errorCodes';

const router = express.Router();

/**
 * HELPER: Calcular variación porcentual
 */
const calculateVariation = (current: number, previous: number) => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return Number((((current - previous) / previous) * 100).toFixed(2));
};

/**
 * HELPER: Obtener rangos de fecha para mes actual y anterior
 */
const getDateRanges = (year: number, month: number) => {
    // Mes Actual (0-11)
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);

    // Mes Anterior
    const prevDate = new Date(startDate);
    prevDate.setMonth(prevDate.getMonth() - 1);
    const prevYear = prevDate.getFullYear();
    const prevMonth = prevDate.getMonth() + 1; // 1-12

    const prevStartDate = new Date(prevYear, prevMonth - 1, 1);
    const prevEndDate = new Date(prevYear, prevMonth, 0, 23, 59, 59);

    return { startDate, endDate, prevStartDate, prevEndDate };
};

/**
 * DASHBOARD SUMMARY
 * GET /dashboard/summary?year=Y&month=X
 */
router.get('/summary', authMiddleware, async (req: AuthRequest, res) => {
    try {
        if (!req.user) return res.status(401).json(formatError(ErrorCodes.AUTH.TOKEN_INVALID));

        const year = parseInt(req.query.year as string) || new Date().getFullYear();
        const month = parseInt(req.query.month as string) || (new Date().getMonth() + 1);

        const { startDate, endDate, prevStartDate, prevEndDate } = getDateRanges(year, month);
        const userId = req.user.id;

        // 1. INGRESOS (INCOME)
        const incomeCurrent = await Income.sum('amount', {
            where: { userId, id_estado: 1, date: { [Op.between]: [startDate, endDate] } }
        }) || 0;

        const incomePrev = await Income.sum('amount', {
            where: { userId, id_estado: 1, date: { [Op.between]: [prevStartDate, prevEndDate] } }
        }) || 0;

        // 2. GASTOS (EXPENSE) - Excluyendo deudas (debtId IS NULL)
        const expenseCurrent = await Expense.sum('amount', {
            where: { userId, id_estado: 1, debtId: null, date: { [Op.between]: [startDate, endDate] } }
        }) || 0;

        const expensePrev = await Expense.sum('amount', {
            where: { userId, id_estado: 1, debtId: null, date: { [Op.between]: [prevStartDate, prevEndDate] } }
        }) || 0;

        // 3. DEUDAS (DEBT PAYMENTS) - Solo cuotas (debtId IS NOT NULL)
        const debtPaymentCurrent = await Expense.sum('amount', {
            where: { userId, id_estado: 1, debtId: { [Op.ne]: null }, date: { [Op.between]: [startDate, endDate] } }
        }) || 0;

        const debtCount = await Debt.count({
            where: { userId, id_estado: 1 }
        });

        // 4. BALANCE
        const totalOutow = expenseCurrent + debtPaymentCurrent;
        const balance = incomeCurrent - totalOutow;

        res.json({
            period: { month, year },
            summary: {
                income: {
                    total: incomeCurrent,
                    previousMonth: incomePrev,
                    variationPercentage: calculateVariation(incomeCurrent, incomePrev),
                    trend: incomeCurrent >= incomePrev ? 'up' : 'down'
                },
                expense: {
                    total: expenseCurrent,
                    previousMonth: expensePrev,
                    variationPercentage: calculateVariation(expenseCurrent, expensePrev),
                    trend: expenseCurrent <= expensePrev ? 'down' : 'up' // Queremos que bajen
                },
                debt: {
                    totalPayment: debtPaymentCurrent,
                    pendingCount: debtCount
                },
                balance: {
                    total: balance,
                    status: balance >= 0 ? 'positive' : 'negative'
                }
            }
        });

    } catch (error) {
        console.error('Dashboard Summary Error:', error);
        res.status(500).json(formatError(ErrorCodes.SERVER_ERROR));
    }
});

/**
 * CATEGORY DISTRIBUTION
 * GET /dashboard/category-distribution?year=Y&month=X
 */
router.get('/category-distribution', authMiddleware, async (req: AuthRequest, res) => {
    try {
        if (!req.user) return res.status(401).json(formatError(ErrorCodes.AUTH.TOKEN_INVALID));

        const year = parseInt(req.query.year as string) || new Date().getFullYear();
        const month = parseInt(req.query.month as string) || (new Date().getMonth() + 1);
        const { startDate, endDate } = getDateRanges(year, month);

        // Agrupar gastos por categoría
        const expenses = await Expense.findAll({
            where: {
                userId: req.user.id,
                id_estado: 1,
                date: { [Op.between]: [startDate, endDate] }
            },
            attributes: [
                'categoryId',
                [Sequelize.fn('SUM', Sequelize.col('amount')), 'total']
            ],
            include: [{
                model: ExpenseCategory,
                as: 'category',
                attributes: ['id', 'name']
            }],
            group: ['categoryId', 'category.id', 'category.name']
        });

        const totalExpense = expenses.reduce((sum, item) => sum + Number(item.get('total')), 0);

        // Formatear respuesta
        const categories = expenses.map(item => {
            const total = Number(item.get('total'));
            const percentage = totalExpense > 0 ? Number(((total / totalExpense) * 100).toFixed(1)) : 0;
            const category = (item as any).category;

            return {
                id: category?.id,
                name: category?.name || 'Desconocido',
                total,
                percentage,
                color: '#3357FF' // Placeholder, el front puede asignar colores
            };
        });

        res.json({
            total: totalExpense,
            categories
        });

    } catch (error) {
        console.error('Dashboard Distribution Error:', error);
        res.status(500).json(formatError(ErrorCodes.SERVER_ERROR));
    }
});

/**
 * HISTORIAL 6 MESES
 * GET /dashboard/history
 */
router.get('/history', authMiddleware, async (req: AuthRequest, res) => {
    try {
        if (!req.user) return res.status(401).json(formatError(ErrorCodes.AUTH.TOKEN_INVALID));

        const monthsToLoad = 6;
        const history = [];

        // Iterar hacia atrás desde el mes actual
        for (let i = monthsToLoad - 1; i >= 0; i--) {
            const date = new Date();
            date.setMonth(date.getMonth() - i);
            const year = date.getFullYear();
            const month = date.getMonth() + 1;

            const { startDate, endDate } = getDateRanges(year, month);

            // Consultas paralelas para el mes
            const [income, expense, debt] = await Promise.all([
                Income.sum('amount', { where: { userId: req.user.id, id_estado: 1, date: { [Op.between]: [startDate, endDate] } } }),
                Expense.sum('amount', { where: { userId: req.user.id, id_estado: 1, debtId: null, date: { [Op.between]: [startDate, endDate] } } }),
                Expense.sum('amount', { where: { userId: req.user.id, id_estado: 1, debtId: { [Op.ne]: null }, date: { [Op.between]: [startDate, endDate] } } })
            ]);

            history.push({
                month,
                year,
                income: income || 0,
                expense: expense || 0,
                debt: debt || 0
            });
        }

        res.json({ history });

    } catch (error) {
        console.error('Dashboard History Error:', error);
        res.status(500).json(formatError(ErrorCodes.SERVER_ERROR));
    }
});

export default router;
