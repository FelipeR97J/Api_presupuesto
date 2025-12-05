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
router.use('/inventory', routes.inventory);


