import { apiClient } from './ApiClient';

export const createReviewApi = (review: any) => {
  return apiClient.post('/reviews', review);
};

export const readAllReviewsApi = (bookId: string) => {
  return apiClient.get('/reviews', { params: { bookId } }); // bookId를 쿼리 패러미터로 전달
};

export const updateReviewApi = (reviewId: number, review: any) => {
  return apiClient.put(`/reviews/${reviewId}`, review);
};

export const deleteReviewApi = (reviewId: number) => {
  return apiClient.delete(`/reviews/${reviewId}`);
};

export const createReplyApi = (reviewId: number, reply: any) => {
  return apiClient.post(`/replies/${reviewId}`, reply);
};

export const readAllRepliesApi = () => {
  return apiClient.get('/replies');
};

export const updateReplyApi = (reviewId: number, reply: any) => {
  return apiClient.put(`/replies/${reviewId}`, reply);
};

export const deleteReplyApi = (reviewId: number, replyId: number) => {
  return apiClient.delete(`/replies/${reviewId}/${replyId}`);
}; 