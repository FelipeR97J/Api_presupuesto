import express from 'express';
import { Op } from 'sequelize';
import { Expense } from '../entityDB/mysql/expense';
import { Income } from '../entityDB/mysql/income';
import { Debt } from '../entityDB/mysql/debt';
import { ExpenseCategory } from '../entityDB/mysql/expenseCategory';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { ErrorCodes, formatError } from '../utils/errorCodes';

const router = express.Router();

/**
 * GET /reports/monthly
 * params: year, month
 */
router.get('/monthly', authMiddleware, async (req: AuthRequest, res) => {
    try {
        if (!req.user) {
            return res.status(401).json(formatError(ErrorCodes.AUTH.TOKEN_INVALID));
        }

        const year = parseInt(req.query.year as string);
        const month = parseInt(req.query.month as string);

        if (!year || !month || month < 1 || month > 12) {
            return res.status(400).json({ error: 'Invalid year or month' });
        }

        // --- Date Ranges ---
        // Current Month
        const currentMsStart = new Date(year, month - 1, 1, 0, 0, 0);
        const currentMonthEnd = new Date(year, month, 0, 23, 59, 59);

        // Previous Month
        const prevMonthDate = new Date(year, month - 2, 1);
        const prevYear = prevMonthDate.getFullYear();
        const prevMonth = prevMonthDate.getMonth() + 1;
        const prevMonthStart = new Date(prevYear, prevMonth - 1, 1, 0, 0, 0);
        const prevMonthEnd = new Date(prevYear, prevMonth, 0, 23, 59, 59);


        // --- Data Fetching ---

        // 1. Current Month Expenses
        const currentExpenses = await Expense.findAll({
            where: {
                userId: req.user.id,
                date: { [Op.between]: [currentMsStart, currentMonthEnd] },
                id_estado: 1
            },
            include: [{ model: ExpenseCategory, as: 'category' }]
        });

        // 2. Previous Month Expenses
        const prevExpenses = await Expense.findAll({
            where: {
                userId: req.user.id,
                date: { [Op.between]: [prevMonthStart, prevMonthEnd] },
                id_estado: 1
            },
            include: [{ model: ExpenseCategory, as: 'category' }]
        });

        // 3. Current Month Incomes
        const currentIncomes = await Income.findAll({
            where: {
                userId: req.user.id,
                date: { [Op.between]: [currentMsStart, currentMonthEnd] },
                id_estado: 1
            }
        });

        // 4. Previous Month Incomes
        const prevIncomes = await Income.findAll({
            where: {
                userId: req.user.id,
                date: { [Op.between]: [prevMonthStart, prevMonthEnd] },
                id_estado: 1
            }
        });

        // 5. Active Debts
        // Find debts that STARTED before or during this month AND ended after or during this month
        // Actually, we can just find debts where userId matches, and then filter in memory for complex installment logic
        // But better: A debt is active if startDate <= currentMonthEnd AND (startDate + installments months) >= currentMsStart
        const allDebts = await Debt.findAll({
            where: {
                userId: req.user.id,
                startDate: { [Op.lte]: currentMonthEnd },
                id_estado: 1
            }
        });


        // --- Processing & Logic ---

        // Helper to sum amounts
        const sumAmount = (items: any[]) => items.reduce((sum, item) => sum + Number(item.amount), 0);

        const totalExpenseCurrent = sumAmount(currentExpenses);
        const totalExpensePrev = sumAmount(prevExpenses);
        const totalIncomeCurrent = sumAmount(currentIncomes);
        const totalIncomePrev = sumAmount(prevIncomes);

        // a. Debts of the Month (Active Installments) & Finished Debts
        const debtsOfMonth: any[] = [];
        const finishedDebts: any[] = [];

        for (const debt of allDebts) {
            const startDate = new Date(debt.get('startDate') as Date);
            const installments = Number(debt.get('installments'));

            // Calculate End Date of Debt (approx)
            // Last installment date is startDate + (installments - 1) months
            const lastInstallmentDate = new Date(startDate);
            lastInstallmentDate.setMonth(lastInstallmentDate.getMonth() + installments - 1); // e.g. start Jan, 6 inst. last is Jun.

            // Check if debt is active in current month range
            // Active if: Start <= MonthEnd AND End >= MonthStart
            // Ideally currentMsStart <= lastInstallmentDate
            if (lastInstallmentDate >= currentMsStart) {

                // It is active (or finished in future).
                // "Debts of the month" are usually represented by the Expense entry with debtId.
                // But we can list the Debt object here as context.
                debtsOfMonth.push({
                    debtId: debt.get('id'),
                    description: debt.get('description'),
                    totalAmount: debt.get('totalAmount'),
                    installments: installments,
                    currentInstallmentIndex: -1 // Todo calculation if needed, but Expense description usually has it
                });

                // Check if it FINISHES this month
                // Finishes if lastInstallmentDate is within [currentMsStart, currentMonthEnd]
                if (lastInstallmentDate >= currentMsStart && lastInstallmentDate <= currentMonthEnd) {
                    finishedDebts.push({
                        debtId: debt.get('id'),
                        description: debt.get('description'),
                        finalDate: lastInstallmentDate
                    });
                }
            }
        }

        // ... (previous logic)

        // b. Expenses Breakdown (Updated for Comparisons)
        // Store Full Category Objects to get ID and Name later
        const currentCategoriesMap: Record<string, number> = {};
        currentExpenses.forEach((exp: any) => {
            const catName = exp.category?.name || 'Uncategorized';
            currentCategoriesMap[catName] = (currentCategoriesMap[catName] || 0) + Number(exp.amount);
        });

        const prevCategoriesMap: Record<string, number> = {};
        prevExpenses.forEach((exp: any) => {
            const catName = exp.category?.name || 'Uncategorized';
            prevCategoriesMap[catName] = (prevCategoriesMap[catName] || 0) + Number(exp.amount);
        });

        // Generate Structured Comparisons
        const comparisons: any[] = [];
        const allCategories = new Set([...Object.keys(currentCategoriesMap), ...Object.keys(prevCategoriesMap)]);

        allCategories.forEach(catName => {
            const currentAmount = currentCategoriesMap[catName] || 0;
            const previousAmount = prevCategoriesMap[catName] || 0;
            const difference = currentAmount - previousAmount;

            let percentage = 0;
            if (previousAmount > 0) {
                percentage = Math.round(((currentAmount - previousAmount) / previousAmount) * 100);
            } else if (currentAmount > 0) {
                percentage = 100; // New expense
            }

            comparisons.push({
                category: catName,
                currentAmount,
                previousAmount,
                difference,
                percentage: `${percentage > 0 ? '+' : ''}${percentage}%`
            });
        });

        // Sort by highest current spend
        comparisons.sort((a, b) => b.currentAmount - a.currentAmount);


        // c. Insights / Differences (Updated to use maps)
        const insights: string[] = [];

        // 1. Balance
        const balance = totalIncomeCurrent - totalExpenseCurrent;
        insights.push(balance >= 0
            ? `💰 El Balance es positivo: Ahorraste $${balance.toLocaleString('es-CL')}`
            : `⚠️ Gastaste más de lo que ganaste: Balance negativo de $${balance.toLocaleString('es-CL')}`
        );

        // 2. Total Spending Comparison
        const diffExpense = totalExpenseCurrent - totalExpensePrev;
        if (totalExpensePrev > 0) {
            if (diffExpense > 0) {
                insights.push(`📉 Gastaste $${diffExpense.toLocaleString('es-CL')} más que el mes anterior.`);
            } else if (diffExpense < 0) {
                insights.push(`🎉 Gastaste $${Math.abs(diffExpense).toLocaleString('es-CL')} menos que el mes anterior. ¡Bien hecho!`);
            } else {
                insights.push(`⚖️ Gastaste exactamente lo mismo que el mes anterior.`);
            }
        }

        // 3. Category Insights
        let maxSpentCategory = { name: '', amount: 0 };

        comparisons.forEach(comp => {
            // Find max
            if (comp.currentAmount > maxSpentCategory.amount) {
                maxSpentCategory = { name: comp.category, amount: comp.currentAmount };
            }

            // Significant differences
            if (comp.previousAmount > 0) {
                if (comp.difference > 5000) {
                    insights.push(`📈 ${comp.category}: Te salió $${comp.difference.toLocaleString('es-CL')} más caro que el mes pasado.`);
                } else if (comp.difference < -2000) {
                    insights.push(`📉 ${comp.category}: Ahorraste $${Math.abs(comp.difference).toLocaleString('es-CL')} comparado con el mes pasado.`);
                }
            } else if (comp.currentAmount > 0) { // Changed threshold to 0 to catch all new
                if (comp.currentAmount > 10000) {
                    insights.push(`🆕 ${comp.category}: Este mes gastaste $${comp.currentAmount.toLocaleString('es-CL')} en esta categoría.`);
                }
            }
        });

        // 4. Max Expense
        if (maxSpentCategory.amount > 0) {
            insights.push(`🏆 En lo que más se gastó este mes fue en: ${maxSpentCategory.name} ($${maxSpentCategory.amount.toLocaleString('es-CL')}).`);
        }

        // 5. Missing categories
        comparisons.forEach(comp => {
            if (comp.currentAmount === 0 && comp.previousAmount > 5000) {
                insights.push(`👏 Este mes no gastaste nada en: ${comp.category} (Ahorro de $${comp.previousAmount.toLocaleString('es-CL')}).`);
            }
        });


        // --- Final Response ---
        res.status(200).json({
            date: {
                year,
                month,
                start: currentMsStart,
                end: currentMonthEnd
            },
            summary: {
                totalIncome: totalIncomeCurrent,
                totalExpense: totalExpenseCurrent,
                balance: balance
            },
            debts: {
                activeCount: debtsOfMonth.length,
                finishedCount: finishedDebts.length,
                activeList: debtsOfMonth,
                finishedList: finishedDebts
            },
            expenses: {
                byCategory: currentCategoriesMap,
                comparisons: comparisons, // NEW: Detailed Comparison List
                list: currentExpenses
            },
            incomes: {
                total: totalIncomeCurrent,
                list: currentIncomes
            },
            insights: insights
        });

    } catch (error) {
        console.error('Error generating monthly report:', error);
        res.status(500).json(formatError(ErrorCodes.SERVER_ERROR));
    }
});

export default router;
