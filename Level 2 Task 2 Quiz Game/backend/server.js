import express from 'express';
import cors from 'cors';
import questionsRoutes from './routes/questionsRoutes.js';

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

// Route
app.use('/api/questions', questionsRoutes);

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
