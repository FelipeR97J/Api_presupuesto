import express from 'express';
import { Instrument } from '../entityDB/mysql/instrument';

const router = express.Router();

router.get('/status', (req, res) => {
  res.status(200).send('Instruments Route OK');
});

router.get('/', async (req, res) => {
  try {
    const instruments = await Instrument.findAll();
    res.status(200).json(instruments);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching instruments' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { name, type, description } = req.body;
    const instrument = await Instrument.create({
      name,
      type,
      description,
    });
    res.status(201).json(instrument);
  } catch (error) {
    res.status(500).json({ error: 'Error creating instrument' });
  }
});

export default router;
