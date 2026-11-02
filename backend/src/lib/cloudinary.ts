import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';
dotenv.config();

// Hỗ trợ cả CLOUDINARY_URL hoặc từng biến riêng lẻ
if (process.env.CLOUDINARY_URL) {
  cloudinary.config({
    cloudinary_url: process.env.CLOUDINARY_URL,
    secure: true
  });
} else {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME || process.env.CLOUD_NAME || 'yqbkibfq',
    api_key: process.env.CLOUDINARY_API_KEY || process.env.API_KEY || '',
    api_secret: process.env.CLOUDINARY_API_SECRET || process.env.API_SECRET || '',
    secure: true
  });
}

export default cloudinary;
