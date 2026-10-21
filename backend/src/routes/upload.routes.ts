import { Router, Request, Response } from 'express';
import multer from 'multer';
import cloudinary from '../lib/cloudinary';

const router = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024 // Tối đa 10MB
  }
});

// 1. Upload bằng file qua multipart/form-data
router.post('/image', upload.single('file'), async (req: Request, res: Response): Promise<void> => {
  try {
    // Trường hợp 1: Tải lên qua multipart file
    if (req.file) {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: 'dcor/products',
          format: 'webp',
          transformation: [{ quality: 'auto:good' }]
        },
        (error, result) => {
          if (error || !result) {
            console.error('Lỗi upload Cloudinary:', error);
            res.status(500).json({ message: 'Không thể upload ảnh lên Cloudinary.', error: error?.message });
            return;
          }
          res.json({
            url: result.secure_url,
            public_id: result.public_id,
            format: result.format,
            width: result.width,
            height: result.height,
            bytes: result.bytes
          });
        }
      );

      uploadStream.end(req.file.buffer);
      return;
    }

    // Trường hợp 2: Tải lên qua Base64 data string (từ clipboard hoặc preview)
    const { image } = req.body;
    if (image && typeof image === 'string') {
      const result = await cloudinary.uploader.upload(image, {
        folder: 'dcor/products',
        format: 'webp',
        transformation: [{ quality: 'auto:good' }]
      });

      res.json({
        url: result.secure_url,
        public_id: result.public_id,
        format: result.format,
        width: result.width,
        height: result.height,
        bytes: result.bytes
      });
      return;
    }

    res.status(400).json({ message: 'Vui lòng cung cấp file ảnh hợp lệ hoặc chuỗi base64.' });
  } catch (error: any) {
    console.error('Lỗi xử lý upload ảnh:', error);
    res.status(500).json({ message: 'Lỗi server khi nén và tải ảnh.', error: error?.message });
  }
});

export default router;
