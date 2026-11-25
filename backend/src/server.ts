import express from 'express';
import pool from './db';
import authRoutes from './routes/auth';


const app = express();
const PORT = 3000;

app.use(express.json());
app.use('/api/auth', authRoutes);

app.get('/', (req, res) => {
    res.send('Time Tracking System API is running');
});

app.get('/test-db', async (req, res) => {
    try {
        await pool.query('SELECT 1');
        res.send('Database connection successful');
    } catch (error) {
        console.error(error);
        res.status(500).send('Database connection failed');
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});