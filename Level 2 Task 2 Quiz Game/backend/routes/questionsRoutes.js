import express from 'express';
import { questionsByCategory } from '../data/questions.js';

const router = express.Router();

router.get('/:category', (req, res) => {
  const { category } = req.params;
  const data = questionsByCategory[category.toLowerCase()];

  if (!data) {
    return res.status(404).json({ error: 'Category not found' });
  }

  // Shuffle and return first 5
  const shuffled = data.sort(() => 0.5 - Math.random());
  res.json(shuffled.slice(0, 5));
});

export default router;
