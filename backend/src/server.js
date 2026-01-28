import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import morgan from 'morgan';
import authRoutes from './routes/auth.js';
import postRoutes from './routes/posts.js';
import challengeRoutes from './routes/challenges.js';

dotenv.config();

const app = express();

app.use(cors({ origin: process.env.CORS_ORIGIN, credentials: true }));
app.use(express.json());
app.use(morgan('dev'));

app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/auth', authRoutes);
app.use('/posts', postRoutes);
app.use('/challenges', challengeRoutes);

const port = process.env.PORT || 4000;
app.listen(port, () => {
    console.log(`BroVerse API listening on ${port}`);
});
