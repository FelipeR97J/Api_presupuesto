import express from 'express';
import { CreditCard } from '../entityDB/mysql/creditCard';
import { Bank } from '../entityDB/mysql/bank';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { ErrorCodes, formatError } from '../utils/errorCodes';

const router = express.Router();

/**
 * LISTAR TARJETAS
 * GET /credit-card
 */
router.get('/', authMiddleware, async (req: AuthRequest, res) => {
    try {
        if (!req.user) return res.status(401).json(formatError(ErrorCodes.AUTH.TOKEN_INVALID));

        const cards = await CreditCard.findAll({
            where: { userId: req.user.id, id_estado: 1 },
            include: [{ model: Bank, as: 'bank' }],
            order: [['name', 'ASC']]
        });

        res.status(200).json(cards);
    } catch (error) {
        console.error('Error getting cards:', error);
        res.status(500).json(formatError(ErrorCodes.SERVER_ERROR));
    }
});

/**
 * CREAR TARJETA
 * POST /credit-card
 * Body: { name, bankId }
 */
router.post('/', authMiddleware, async (req: AuthRequest, res) => {
    try {
        if (!req.user) return res.status(401).json(formatError(ErrorCodes.AUTH.TOKEN_INVALID));

        const { name, bankId } = req.body;
        if (!name || !bankId) return res.status(400).json({ error: 'Name and bankId are required' });

        // Validar que el banco sea del usuario
        const bank = await Bank.findOne({ where: { id: bankId, userId: req.user.id } });
        if (!bank) return res.status(404).json({ error: 'Bank not found' });

        const card = await CreditCard.create({
            userId: req.user.id,
            bankId,
            name,
            id_estado: 1
        });

        res.status(201).json(card);
    } catch (error) {
        console.error('Error creating card:', error);
        res.status(500).json(formatError(ErrorCodes.SERVER_ERROR));
    }
});

/**
 * ELIMINAR TARJETA
 * DELETE /credit-card/:id
 */
router.delete('/:id', authMiddleware, async (req: AuthRequest, res) => {
    try {
        if (!req.user) return res.status(401).json(formatError(ErrorCodes.AUTH.TOKEN_INVALID));

        const card = await CreditCard.findOne({
            where: { id: req.params.id, userId: req.user.id }
        });

        if (!card) return res.status(404).json({ error: 'Card not found' });

        await card.destroy();
        res.status(200).json({ message: 'Card deleted successfully' });
    } catch (error) {
        console.error('Error deleting card:', error);
        res.status(500).json(formatError(ErrorCodes.SERVER_ERROR));
    }
});

/**
 * EDITAR TARJETA (Nombre o Desactivar)
 * PUT /credit-card/:id
 * Body: { name?, id_estado? }
 */
router.put('/:id', authMiddleware, async (req: AuthRequest, res) => {
    try {
        if (!req.user) return res.status(401).json(formatError(ErrorCodes.AUTH.TOKEN_INVALID));

        const { name, id_estado } = req.body;
        const card = await CreditCard.findOne({
            where: { id: req.params.id, userId: req.user.id }
        });

        if (!card) return res.status(404).json({ error: 'Card not found' });

        await card.update({
            name: name || card.get('name'),
            id_estado: id_estado !== undefined ? id_estado : card.get('id_estado')
        });

        res.status(200).json(card);
    } catch (error) {
        console.error('Error updating card:', error);
        res.status(500).json(formatError(ErrorCodes.SERVER_ERROR));
    }
});

export default router;
