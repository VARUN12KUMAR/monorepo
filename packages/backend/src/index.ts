import express from 'express';
import cors from 'cors';
import initDb  from './config/database';
import authRoutes from './routes/auth';
import taskRoutes from './routes/task';

const app = express();
const PORT = parseInt(process.env.PORT || '4000', 10);
const HOST = process.env.HOST || '0.0.0.0';

app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Public auth routes
app.use('/api/auth', authRoutes);

// Protected routes
app.use('/api/tasks', taskRoutes);

// Start server after database is initialized
const startServer = async () => {
  try {
    await initDb; // Wait for database initialization
    app.listen(PORT, HOST, () => {
      console.log(`Server running on http://${HOST}:${PORT}`);
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
};

startServer(); 