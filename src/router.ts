import express from 'express';
import { routes } from './routes/index';

export const router = express.Router();

router.use('/', routes.root);
router.use('/auth', routes.auth);
router.use('/admin', routes.admin);
router.use('/roles', routes.roles);
router.use('/estados', routes.estado);
router.use('/income-categories', routes.incomeCategory);
router.use('/income', routes.income);
router.use('/expense-categories', routes.expenseCategory);
router.use('/expense', routes.expense);
router.use('/debt', routes.debt);
router.use('/bank', routes.bank);
router.use('/credit-card', routes.creditCard);
router.use('/dashboard', routes.dashboard);
router.use('/inventory', routes.inventory);
router.use('/reports', routes.reports);


