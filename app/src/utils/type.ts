export interface Book {
  key: string;
  title?: string;
  author_name?: string[];
  publisher?: string[];
  first_publish_year?: number;
  language?: string[];
  cover_i?: number;
  number_of_pages?: number;
  subject?: string[];
}

export interface Review {
  id: number;
  bookId: string;
  content: string;
  likes: string[];
  createdAt: string;
  replies: Reply[];
  userId: string;
}

export interface Reply {
  id: number;
  reviewId: number;
  content: string;
  authorId: string;
  createdAt: string;
  user?: { username: string };
  userId?: string;
}