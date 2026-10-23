export interface TaggedProduct {
  x: number;
  y: number;
  productId?: string;
  name: string;
  price: number;
}

export interface PostComment {
  id: string;
  postId?: string;
  authorName: string;
  content: string;
  status: 'VISIBLE' | 'HIDDEN' | 'APPROVED' | 'PENDING' | string;
  createdAt: string;
}

export interface DesignPost {
  id: string;
  title: string;
  authorName: string;
  description?: string;
  imageUrl: string;
  taggedProducts?: TaggedProduct[];
  likesCount: number;
  status: 'PUBLISHED' | 'PENDING' | 'REJECTED' | string;
  createdAt: string;
  updatedAt?: string;
  comments?: PostComment[];
}
