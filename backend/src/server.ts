import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import authRoutes from './routes/auth.routes';
import cartRoutes from './routes/cart.routes';

dotenv.config();

const app = express();
const prisma = new PrismaClient();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Backend is running!' });
});

// Gắn router xác thực
app.use('/api/auth', authRoutes);

// Gắn router giỏ hàng
app.use('/api/store/cart', cartRoutes);

// Example route
// app.get('/api/products', async (req, res) => {
//   const products = await prisma.product.findMany();
//   res.json(products);
// });

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
