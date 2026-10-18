import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import prisma from './lib/prisma';
import authRoutes from './routes/auth.routes';
import cartRoutes from './routes/cart.routes';
import inventoryRoutes from './routes/inventory.routes';
import staffRoutes from './routes/staff.routes';
import reportRoutes from './routes/report.routes';

const app = express();
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

// Gắn router quản lý nhân viên & gửi thư kích hoạt
app.use('/api/admin/staff', staffRoutes);

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
      const variantsWithDimensions = product.variants.map((v: any) => {
        const opt = typeof v.optionValues === 'string' ? JSON.parse(v.optionValues) : (v.optionValues || {});
        const attrs = opt.attributes || {};
        const parseNum = (val: any) => {
          if (!val) return null;
          const match = String(val).match(/\d+/);
          return match ? parseInt(match[0], 10) : null;
        };
        return {
          ...v,
          images: opt.images || [],
          dimensions: {
            width: parseNum(attrs.width) || parseNum(attrs.length),
            depth: parseNum(attrs.depth),
            height: parseNum(attrs.height),
            weight: parseNum(attrs.weight)
          },
          attributes: attrs
        };
      });

      const firstVariantAttrs = variantsWithDimensions[0]?.attributes || {};
      const descVi = firstVariantAttrs.designFeatures_vi 
        ? firstVariantAttrs.designFeatures_vi.split('|').join('\n\n')
        : (firstVariantAttrs.designFeatures ? firstVariantAttrs.designFeatures.split('|').join('\n\n') : undefined);

      res.json({
        ...product,
        description_vi: descVi,
        variants: variantsWithDimensions
      });
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
