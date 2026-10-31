export interface BlogCategory {
  id: string;
  name: string;
  slug: string;
  sortOrder: number;
  isActive: boolean;
  postCount: number;
}

export interface BlogPostSummary {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  coverImageUrl?: string | null;
  category: {
    name: string;
    slug: string;
  };
  tags: string[];
  authorName: string;
  publishedAt: string;
  likesCount: number;
  commentCount: number;
  readingMinutes: number;
}

export interface BlogPostsListResponse {
  items: BlogPostSummary[];
  total: number;
  page: number;
  pageSize: number;
}

export interface BlogHeadingBlock {
  type: 'heading';
  level: 2 | 3;
  text: string;
  id?: string;
}

export interface BlogParagraphBlock {
  type: 'paragraph';
  text: string;
}

export interface BlogImageBlock {
  type: 'image';
  url: string;
  caption?: string;
}

export interface BlogQuoteBlock {
  type: 'quote';
  text: string;
  cite?: string;
}

export interface BlogListBlock {
  type: 'list';
  ordered: boolean;
  items: string[];
}

export interface BlogProductsBlock {
  type: 'products';
  title?: string;
  productIds: string[];
}

export type BlogBlock =
  | BlogHeadingBlock
  | BlogParagraphBlock
  | BlogImageBlock
  | BlogQuoteBlock
  | BlogListBlock
  | BlogProductsBlock;

export interface BlogProduct {
  id: string;
  name: string;
  image: string;
  price: number;
}

export interface BlogRelatedPost {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  coverImageUrl?: string | null;
  publishedAt: string;
}

export interface BlogPostDetail {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  blocks: BlogBlock[];
  coverImageUrl?: string | null;
  category: {
    id: string;
    name: string;
    slug: string;
  };
  tags: string[];
  seoDescription?: string | null;
  authorName: string;
  publishedAt: string;
  likesCount: number;
  viewsCount: number;
  commentCount: number;
  readingMinutes: number;
  products: BlogProduct[];
  viewer: {
    liked: boolean;
  };
  related: BlogRelatedPost[];
}

export interface BlogComment {
  id: string;
  postId: string;
  authorName: string;
  content: string;
  createdAt: string;
  isMine: boolean;
}

export interface BlogCommentsResponse {
  items: BlogComment[];
  total: number;
  page: number;
  pageSize: number;
}

export interface LikePostResponse {
  liked: boolean;
  likesCount: number;
}

export interface CreateCommentResponse {
  message: string;
  comment: BlogComment;
}

export interface Blog404Response {
  message: string;
  suggestions?: BlogRelatedPost[];
}

export interface BlogTocItem {
  id: string;
  text: string;
  level: 2 | 3;
}

