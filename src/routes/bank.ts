import express from 'express';
import { Bank } from '../entityDB/mysql/bank';
import { CreditCard } from '../entityDB/mysql/creditCard';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { ErrorCodes, formatError } from '../utils/errorCodes';

const router = express.Router();

/**
 * LISTAR BANCOS
 * GET /bank
 */
router.get('/', authMiddleware, async (req: AuthRequest, res) => {
    try {
        if (!req.user) return res.status(401).json(formatError(ErrorCodes.AUTH.TOKEN_INVALID));

        const banks = await Bank.findAll({
            where: { userId: req.user.id, id_estado: 1 },
            order: [['name', 'ASC']]
        });

        res.status(200).json(banks);
    } catch (error) {
        console.error('Error getting banks:', error);
        res.status(500).json(formatError(ErrorCodes.SERVER_ERROR));
    }
});

/**
 * CREAR BANCO
 * POST /bank
 * Body: { name }
 */
router.post('/', authMiddleware, async (req: AuthRequest, res) => {
    try {
        if (!req.user) return res.status(401).json(formatError(ErrorCodes.AUTH.TOKEN_INVALID));

        const { name } = req.body;
        if (!name) return res.status(400).json({ error: 'Name is required' });

        const bank = await Bank.create({
            userId: req.user.id,
            name,
            id_estado: 1
        });

        res.status(201).json(bank);
    } catch (error) {
        console.error('Error creating bank:', error);
        res.status(500).json(formatError(ErrorCodes.SERVER_ERROR));
    }
});

/**
 * ELIMINAR BANCO
 * DELETE /bank/:id
 * (Borra en cascada sus tarjetas)
 */
router.delete('/:id', authMiddleware, async (req: AuthRequest, res) => {
    try {
        if (!req.user) return res.status(401).json(formatError(ErrorCodes.AUTH.TOKEN_INVALID));

        const bank = await Bank.findOne({
            where: { id: req.params.id, userId: req.user.id }
        });

        if (!bank) return res.status(404).json({ error: 'Bank not found' });

        await bank.destroy();
        res.status(200).json({ message: 'Bank deleted successfully' });
    } catch (error) {
        console.error('Error deleting bank:', error);
        res.status(500).json(formatError(ErrorCodes.SERVER_ERROR));
    }
});

/**
 * EDITAR BANCO (Nombre o Desactivar)
 * PUT /bank/:id
 * Body: { name?, id_estado? }
 */
router.put('/:id', authMiddleware, async (req: AuthRequest, res) => {
    try {
        if (!req.user) return res.status(401).json(formatError(ErrorCodes.AUTH.TOKEN_INVALID));

        const { name, id_estado } = req.body;
        const bank = await Bank.findOne({
            where: { id: req.params.id, userId: req.user.id }
        });

        if (!bank) return res.status(404).json({ error: 'Bank not found' });

        await bank.update({
            name: name || bank.get('name'),
            id_estado: id_estado !== undefined ? id_estado : bank.get('id_estado')
        });

        res.status(200).json(bank);
    } catch (error) {
        console.error('Error updating bank:', error);
        res.status(500).json(formatError(ErrorCodes.SERVER_ERROR));
    }
});

export default router;
