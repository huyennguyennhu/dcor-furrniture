import { Router, Request, Response } from 'express';
import prisma from '../lib/prisma';

const router = Router();

// GET /api/administrative/provinces - Lấy toàn bộ danh sách tỉnh/thành phố
router.get('/provinces', async (req: Request, res: Response) => {
  try {
    const provinces: any = await prisma.$queryRawUnsafe(`
      SELECT "id", "name", "code"
      FROM "Province"
      ORDER BY "name" ASC;
    `);
    res.json(provinces);
  } catch (error) {
    console.error('Lỗi lấy danh sách tỉnh/thành:', error);
    res.status(500).json({ error: 'Không thể lấy danh sách tỉnh/thành phố.' });
  }
});

// GET /api/administrative/wards - Lấy danh sách phường/xã theo tỉnh
// Params: ?provinceId=... hoặc ?provinceName=...
router.get('/wards', async (req: Request, res: Response) => {
  try {
    const { provinceId, provinceName } = req.query;

    if (!provinceId && !provinceName) {
      return res.status(400).json({ error: 'Vui lòng cung cấp provinceId hoặc provinceName.' });
    }

    let wards: any = [];

    if (provinceId) {
      wards = await prisma.$queryRawUnsafe(`
        SELECT "id", "name", "code", "provinceId"
        FROM "Ward"
        WHERE "provinceId" = $1
        ORDER BY "name" ASC;
      `, String(provinceId));
    } else if (provinceName) {
      wards = await prisma.$queryRawUnsafe(`
        SELECT w."id", w."name", w."code", w."provinceId"
        FROM "Ward" w
        JOIN "Province" p ON w."provinceId" = p."id"
        WHERE LOWER(p."name") = LOWER($1)
           OR LOWER(p."code") = LOWER($1)
        ORDER BY w."name" ASC;
      `, String(provinceName).trim());
    }

    res.json(wards);
  } catch (error) {
    console.error('Lỗi lấy danh sách phường/xã:', error);
    res.status(500).json({ error: 'Không thể lấy danh sách phường/xã.' });
  }
});

export default router;
