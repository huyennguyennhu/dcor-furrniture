import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // We need to find community posts that tag this product
    // Note: Since tags is a JSON column, we'll fetch approved posts and filter in memory 
    // or if the JSON structure is simple array of IDs, we can use raw query.
    // For now, let's just fetch all approved posts and filter in JS to be safe.
    const posts = await prisma.communityPost.findMany({
      where: { isApproved: true },
      include: { user: { select: { fullName: true, avatarUrl: true } } },
      orderBy: { createdAt: 'desc' }
    });
    
    const relatedPosts = posts.filter(post => {
      if (!post.tags) return false;
      try {
        // Assume tags is an array of objects like [{ productId: '...' }]
        const tags = Array.isArray(post.tags) ? post.tags : JSON.parse(post.tags as string);
        return tags.some((tag: any) => tag.productId === id);
      } catch {
        return false;
      }
    });

    return NextResponse.json(relatedPosts);
  } catch (error: any) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
