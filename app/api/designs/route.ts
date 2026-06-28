import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { v2 as cloudinary } from 'cloudinary';

const prisma = new PrismaClient();

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, backgroundImage, canvasState, isPublished } = body;

    let finalImageUrl = backgroundImage;

    // Check if backgroundImage is a base64 string (starts with data:image)
    if (backgroundImage && backgroundImage.startsWith('data:image')) {
      // Upload to Cloudinary
      const uploadResponse = await cloudinary.uploader.upload(backgroundImage, {
        folder: 'room_img', // Upload to the same folder
      });
      finalImageUrl = uploadResponse.secure_url;
    }

    // In a real app, you would get the user ID from the session (e.g. NextAuth)
    // For now, we will use a dummy user or just require the user to be logged in.
    // If we don't have a user, Prisma will throw an error since userId is required.
    // Let's create a dummy user if none exists for demo purposes.
    let user = await prisma.user.findFirst();
    if (!user) {
      user = await prisma.user.create({
        data: {
          id: 'dummy_user_' + Date.now(),
          name: 'Demo User',
          email: 'demo@example.com',
          role: 'user'
        }
      });
    }

    const design = await prisma.roomDesign.create({
      data: {
        userId: user.id,
        name: name || 'Thiết kế mới',
        backgroundImage: finalImageUrl,
        canvasState: canvasState,
        isPublished: isPublished || false
      }
    });

    return NextResponse.json({ success: true, design });
  } catch (error) {
    console.error('Error saving design:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
