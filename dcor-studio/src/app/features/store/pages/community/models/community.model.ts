export interface TaggedProduct {
  x: number;
  y: number;
  productId?: string;
  name: string;
  price: number;
  imageUrl?: string | null;
}

export interface PostComment {
  id: string;
  postId?: string;
  authorName: string;
  authorAvatar?: string | null;
  content: string;
  status: 'VISIBLE' | 'HIDDEN' | 'APPROVED' | 'PENDING' | string;
  createdAt: string;
}

export interface CommentThread {
  comment: PostComment;
  replies: PostComment[];
}

export interface DesignPost {
  id: string;
  title: string;
  authorName: string;
  authorEmail?: string | null;
  authorAvatar?: string | null;
  description?: string;
  imageUrl: string;
  taggedProducts?: TaggedProduct[];
  likesCount: number;
  status: 'PUBLISHED' | 'PENDING' | 'REJECTED' | string;
  rejectionReason?: string | null;
  createdAt: string;
  updatedAt?: string;
  comments?: PostComment[];
}
