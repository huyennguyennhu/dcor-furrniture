import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import authRoutes from './routes/auth.routes';
import cartRoutes from './routes/cart.routes';
import inventoryRoutes from './routes/inventory.routes';
import reportRoutes from './routes/report.routes';

dotenv.config();

const app = express();
const prisma = new PrismaClient();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.json({ status: 'ok', message: 'Backend is running. See /api/health for health checks.' });
});

app.get('/api/health', async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: 'ok', message: 'Backend and database are connected.' });
  } catch (error) {
    console.error('Health check database error:', error);
    res.status(503).json({ status: 'error', message: 'Backend is running, but the database is unavailable.' });
  }
});

// Gắn router xác thực
app.use('/api/auth', authRoutes);

// Gắn router giỏ hàng
app.use('/api/store/cart', cartRoutes);

// Gắn router phân hệ quản lý kho
app.use('/api/admin/inventory', inventoryRoutes);
app.use('/api/admin/warehouses', (req, res, next) => {
  res.redirect('/api/admin/inventory/warehouses');
});

// Gắn router báo cáo & thống kê
app.use('/api/admin/reports', reportRoutes);

// Example route
app.get('/api/products', async (req, res) => {
  try {
    const products = await prisma.product.findMany({
      include: {
        category: true
      }
    });
    res.json(products);
  } catch (error) {
    console.error('Lỗi lấy danh sách sản phẩm:', error);
    res.status(503).json({ message: 'Không thể lấy sản phẩm từ cơ sở dữ liệu.' });
  }
});

app.get('/api/products/:id', async (req, res) => {
  try {
    const product = await prisma.product.findUnique({ 
      where: { id: req.params.id },
      include: {
        category: true,
        variants: true
      }
    });
    if (product) {
      res.json(product);
    } else {
      res.status(404).json({ error: 'Product not found' });
    }
  } catch (error) {
    console.error('Lỗi lấy thông tin sản phẩm:', error);
    res.status(503).json({ message: 'Không thể lấy sản phẩm từ cơ sở dữ liệu.' });
  }
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
