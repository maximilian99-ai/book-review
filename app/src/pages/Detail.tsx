import React, { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { useAuthStore } from '../stores/useAuthStore';
import { createReviewApi, readAllReviewsApi, updateReviewApi, deleteReviewApi, createReplyApi, readAllRepliesApi, updateReplyApi, deleteReplyApi } from '../apis/DetailApiService';
import { getSessionId, generateSessionId } from '../utils/sessionId';
import { formatDate } from '../utils/formDate';
import type { Book, Review, Reply } from '../utils/type';
import { useQuery, useMutation } from '@tanstack/react-query';

const Detail: React.FC = () => {
  const { id } = useParams<{ id: string }>(); // URL 패러미터에서 도서 ID를 가져옴
  const [book, setBook] = useState<Book | null>(null); // 도서 정보
  const [loading, setLoading] = useState(true); // 로딩 상태
  const { authenticated, username } = useAuthStore(); // 인증 상태와 사용자명
  const [currentReview, setCurrentReview] = useState(''); // 현재 리뷰 내용
  const [currentPage, setCurrentPage] = useState(1); // 현재 페이지
  const [replyContent, setReplyContent] = useState(''); // 현재 답글 내용
  const [replyingTo, setReplyingTo] = useState<number | null>(null); // 답글을 달고 있는 리뷰 ID
  const [editing, setEditing] = useState<number | null>(null); // 수정 중인 리뷰 ID
  const [editContent, setEditContent] = useState(''); // 수정 중인 리뷰 내용
  const [editingReply, setEditingReply] = useState<number | null>(null); // 수정 중인 답글 ID
  const [editReplyContent, setEditReplyContent] = useState(''); // 수정 중인 답글 내용
  const [sortBy, setSortBy] = useState('latest'); // 정렬 기준 (최신순)
  // setItemsPerPage, queryClient 등 사용하지 않는 변수 제거

  const sessionId = sessionStorage.getItem('sessionId') || generateSessionId(); // 세션 ID를 세션 스토리지에 저장
  if (!sessionStorage.getItem('sessionId')) { // 세션 ID가 없으면 새로 생성
    sessionStorage.setItem('sessionId', sessionId); // 세션 스토리지에 저장
  }
  
  const { data: reviews = [], refetch: refetchReviews } = useQuery({ // 리뷰 목록 가져오기
    queryKey: ['reviews', id], // 도서 ID를 포함한 쿼리 키
    queryFn: () => readAllReviewsApi(id || ''), // 도서 ID를 기반으로 리뷰 목록을 가져오는 API 호출
    select: (res) => (res.data || []).map((review: Review & { user?: { username?: string }, username?: string }) => ({ // 리뷰 데이터 가공
      id: review.id,
      content: review.content,
      bookId: review.bookId,
      likes: Array.isArray(review.likes) ? review.likes : [],
      createdAt: review.createdAt,
      replies: Array.isArray(review.replies) ? review.replies : [],
      userId: review.user?.username || review.username || 'Unknown'
    }))
  });

  const { refetch: refetchReplies } = useQuery({ // 답글 목록 가져오기
    queryKey: ['replies', id], // 도서 ID를 포함한 쿼리 키
    queryFn: () => readAllRepliesApi().then(res => res.data as Reply[] || []) // 답글 목록을 가져오는 API 호출
  });
 
  const reviewAddMutation = useMutation({ // 리뷰 등록 mutation
    mutationFn: (review: Record<string, unknown>) => createReviewApi(review), // 리뷰 등록 API 호출
    onSuccess: () => { // 리뷰 등록 성공시
      alert('Your review has been successfully registered!');
      setCurrentReview('');
      refetchReviews();
      refetchReplies();
      setSortBy('latest');
      setCurrentPage(1);
    },
    onError: (error: unknown) => { // 리뷰 등록 실패시
      if (error && typeof error === 'object' && 'response' in error) { // @ts-expect-error: error 객체에 response 프로퍼티가 없을 수 있으나, axios 에러 타입을 안전하게 처리하기 위함
        alert('Failed to register review: ' + (error.response?.data?.error || 'Server error'));
      } else {
        alert('Failed to register review: Server error');
      }
    }
  });

  const replyAddMutation = useMutation({ // 답글 등록 mutation
    mutationFn: ({ reviewId, reply }: { reviewId: number, reply: Record<string, unknown> }) => createReplyApi(reviewId, reply), // 답글 등록 API 호출
    onSuccess: () => { // 답글 등록 성공시
      setReplyingTo(null);
      setReplyContent('');
      refetchReviews();
      refetchReplies();
    },
    onError: (error: unknown) => { // 답글 등록 실패시
      if (error && typeof error === 'object' && 'response' in error) { // @ts-expect-error: error 객체에 response 프로퍼티가 없을 수 있으나, axios 에러 타입을 안전하게 처리하기 위함
        alert('Failed to register reply: ' + (error.response?.data?.error || 'Server error'));
      } else {
        alert('Failed to register reply: Server error');
      }
    }
  });

  const reviewEditMutation = useMutation({ // 리뷰 수정 mutation
    mutationFn: async ({ reviewId, updatedReview }: { reviewId: number, updatedReview: Record<string, unknown> }) => {
      return await updateReviewApi(reviewId, updatedReview); // 리뷰 수정 API 호출
    },
    onSuccess: () => { // 리뷰 수정 성공시
      setEditing(null);
      setEditContent('');
      refetchReviews();
    },
    onError: (error: unknown) => { // 리뷰 수정 실패시
      if (error && typeof error === 'object' && 'response' in error) { // @ts-expect-error: error 객체에 response 프로퍼티가 없을 수 있으나, axios 에러 타입을 안전하게 처리하기 위함
        alert('Failed to modify review: ' + (error.response?.data?.error || 'Server error'));
      } else {
        alert('Failed to modify review: Server error');
      }
    }
  });
  
  const reviewDeleteMutation = useMutation({ // 리뷰 삭제 mutation
    mutationFn: async (reviewId: number) => {
      return await deleteReviewApi(reviewId); // 리뷰 삭제 API 호출
    },
    onSuccess: () => { // 리뷰 삭제 성공시
      refetchReviews();
    },
    onError: (error: unknown) => { // 리뷰 삭제 실패시
      if (error && typeof error === 'object' && 'response' in error) { // @ts-expect-error: error 객체에 response 프로퍼티가 없을 수 있으나, axios 에러 타입을 안전하게 처리하기 위함
        alert('Failed to delete review: ' + (error.response?.data?.error || 'Server error'));
      } else {
        alert('Failed to delete review: Server error');
      }
    }
  });
  
  const replyEditMutation = useMutation({ // 답글 수정 mutation
    mutationFn: async ({ replyId, reply }: { replyId: number, reply: Record<string, unknown> }) => {
      return await updateReplyApi(replyId, reply); // 답글 수정 API 호출
    },
    onSuccess: () => { // 답글 수정 성공시
      setEditingReply(null);
      setEditReplyContent('');
      refetchReviews();
    },
    onError: (error: unknown) => { // 답글 수정 실패시
      if (error && typeof error === 'object' && 'response' in error) { // @ts-expect-error: error 객체에 response 프로퍼티가 없을 수 있으나, axios 에러 타입을 안전하게 처리하기 위함
        alert('Failed to modify reply: ' + (error.response?.data?.error || 'Server error'));
      } else {
        alert('Failed to modify reply: Server error');
      }
    }
  });
  
  const replyDeleteMutation = useMutation({ // 답글 삭제 mutation
    mutationFn: async ({ reviewId, replyId }: { reviewId: number, replyId: number }) => {
      return await deleteReplyApi(reviewId, replyId); // 답글 삭제 API 호출
    },
    onSuccess: () => { // 답글 삭제 성공시
      refetchReviews();
    },
    onError: (error: unknown) => { // 답글 삭제 실패시
      if (error && typeof error === 'object' && 'response' in error) { // @ts-expect-error: error 객체에 response 프로퍼티가 없을 수 있으나, axios 에러 타입을 안전하게 처리하기 위함
        alert('Failed to delete reply: ' + (error.response?.data?.error || 'Server error'));
      } else {
        alert('Failed to delete reply: Server error');
      }
    }
  });

  useEffect(() => {
    const fetchBook = async () => {
      try {
        setLoading(true);
        const workKey = id; // URL에서 workKey 추출
        const response = await axios.get(`https://openlibrary.org/search.json?q=key:/works/${workKey}`);
        if (response.data.docs && response.data.docs.length > 0) { // 도서 정보가 존재하는 경우
          setBook(response.data.docs[0]); // 도서 정보 저장
        }
      } catch (error) {
        console.error('Failed to load the book detailed information', error);
      } finally {
        setLoading(false);
      }

      // await loadReviewsAndReplies(); // 기존 함수 호출 제거
    };
    
    fetchBook();
  }, [id]);

  const sortedReviews = useMemo(() => { // 리뷰 정렬 함수
    const sorted = [...reviews]; // 리뷰 목록 복사
    switch (sortBy) { /* 정렬값이 각각 최신순, 좋아요순, 답글순일 때 모두 내림차순 정렬 */
      case 'latest':
        return sorted.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      case 'likes':
        return sorted.sort((a, b) => (b.likes?.length || 0) - (a.likes?.length || 0));
      case 'replies':
        return sorted.sort((a, b) => (b.replies?.length || 0) - (a.replies?.length || 0));
      default:
        return sorted;
    }
  }, [reviews, sortBy]);

  const start = (currentPage - 1) * 5;
  const end = start + 5;
  const currentItems = sortedReviews.slice(start, end);
  const totalPages = Math.ceil(sortedReviews.length / 5);

  const submitReview = (e: React.FormEvent) => { // 리뷰 등록 핸들러
    e.preventDefault();
    const token = sessionStorage.getItem('token');
    if (!authenticated || !token) {
      alert('You are not signed in, your token is missing or invalid');
      return;
    }
    const review = {
      bookId: id || '',
      content: currentReview,
      // likes: [] → 새로 등록한 리뷰에 좋아요 수가 0이어야 하는데 1로 시작하는 문제로 주석 처리
    };
    reviewAddMutation.mutate(review);
  };

  const toggleLike = async (reviewId: number) => { // 좋아요 토글 핸들러
    const review = reviews.find(r => r.id === reviewId); // 리뷰 객체를 원본 객체로 변환
    const userId = authenticated ? username || getSessionId() : getSessionId(); // 인증된 사용자 ID 또는 세션 ID 사용

    if (!review) return;
    const currentLikes = Array.isArray(review.likes) ? review.likes.map(String) : []; // 좋아요 목록을 문자열 배열로 변환
    const newLikes = currentLikes.includes(userId) // 현재 사용자가 좋아요를 눌렀는지 확인
      ? currentLikes.filter(id => id !== userId) // 좋아요 취소
      : [...currentLikes, userId]; // 좋아요 추가
      
    try {
      const response = await axios.put(`http://localhost:8080/reviews/${reviewId}/like`, newLikes, { // 인증 헤더를 피하려고 좋아요를 업데이트하기 위한 분할된 axios 인스턴스 사용
        headers: { 
          'Content-Type': 'application/json'
        }
      });
      if (response.status === 200 || response.status === 201) {
        await refetchReviews();
      } else {
        alert('Failed to process Like: Unexpected response from server');
      }
    } catch (error: any) {
      console.error('Failed to toggle Like button:', error);
      alert('Failed to process Like: ' + (error.response?.data?.error || 'Server error'));
    }
  };

  const startReply = (reviewId:number) => { // 답글 작성 시작 핸들러
    if (!authenticated) {
      alert('This service requires login.');
      return;
    }
    setReplyingTo(reviewId);
    setReplyContent('');
  };

  const submitReply = (reviewId: number) => { // 답글 등록 핸들러
    const token = sessionStorage.getItem('token');
    if (!authenticated || !token) {
      alert('You are not signed in, your token is missing or invalid');
      return;
    }
    const reply = { content: replyContent };
    replyAddMutation.mutate({ reviewId, reply });
  };

  const startEdit = (review: Review) => { // 리뷰 수정 시작 핸들러
    if (!authenticated) {
      alert('This service requires login.');
      return;
    }
    setEditing(review.id);
    setEditContent(review.content);
  };

  const submitEdit = (reviewId: number) => { // 리뷰 수정 핸들러
    const token = sessionStorage.getItem('token');
    if (!authenticated || !token) {
      alert('You are not signed in, your token is missing or invalid');
      return;
    }
    const review = reviews.find((r: Review) => r.id === reviewId);
    if (!review) return;
    const updatedReview = {
      content: editContent,
      bookId: review.bookId,
      likes: review.likes,
      createdAt: review.createdAt,
      replies: review.replies
    };
    reviewEditMutation.mutate({ reviewId, updatedReview });
  };

  const startEditReply = (reply: Reply) => { // 답글 수정 시작 핸들러
    if (!authenticated) {
      alert('This service requires login.');
      return;
    }
    setEditingReply(reply.id);
    setEditReplyContent(reply.content);
  };

  const submitEditReply = (replyId: number) => { // 답글 수정 핸들러
    const token = sessionStorage.getItem('token');
    if (!authenticated || !token) {
      alert('You are not signed in, your token is missing or invalid');
      return;
    }
    const reply = { content: editReplyContent };
    replyEditMutation.mutate({ replyId, reply });
  };

  const deleteReview = (reviewId: number) => { // 리뷰 삭제 핸들러
    const token = sessionStorage.getItem('token');
    if (!authenticated || !token) {
      alert('You are not signed in, your token is missing or invalid');
      return;
    }
    if (confirm('Are you sure you wanna delete your review?')) {
      reviewDeleteMutation.mutate(reviewId);
    }
  };

  const deleteReply = (reviewId: number, replyId: number) => { // 답글 삭제 핸들러
    const token = sessionStorage.getItem('token');
    if (!authenticated || !token) {
      alert('You are not signed in, your token is missing or invalid');
      return;
    }
    if (confirm('Are you sure you wanna delete your reply?')) {
      replyDeleteMutation.mutate({ reviewId, replyId });
    }
  };

  // 리뷰/답글 수정, 삭제 등에서도 loadReviewsAndReplies 대신 refetchReviews/refetchReplies 사용
  // 예시: await refetchReviews(); await refetchReplies();

  return (
    <div className="container mx-auto max-w-6xl my-5 px-4">
      <h1 className="mb-2 text-center text-2xl font-bold">📖 Book Detailed Information</h1>

      {loading ? (
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <span className="sr-only">Loading...</span>
        </div>
      ) : book ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="flex flex-col md:flex-row">
            <div className="md:w-1/3">
              <img src={`https://covers.openlibrary.org/b/id/${book.cover_i}-L.jpg`} alt={book.title}
                onError={e => e.currentTarget.src = 'https://placehold.co/400x600?text=No+Image'}
                className="w-full h-auto object-cover md:rounded-l-lg"
              />
            </div>
            <div className="md:w-2/3">
              <div className="p-6">
                <h2 className="text-xl font-bold mb-4">{book.title}</h2>
                <p className="mb-2">
                  <strong>Author:</strong> {book.author_name?.join(', ') || 'No information'}
                </p>
                <p className="mb-2">
                  <strong>Publisher:</strong> {book.publisher?.[0] || 'No information'}
                </p>
                <p className="mb-2">
                  <strong>Published year:</strong> {book.first_publish_year || 'No information'}
                </p>
                <p className="mb-2">
                  <strong>Language:</strong> {book.language?.join(', ') || 'No information'}
                </p>
                <p className="mb-2">
                  <strong>Number of pages:</strong> {book.number_of_pages || 'No information'}
                </p>
                <p className="mb-2">
                  <strong>Subject:</strong> {book.subject?.join(', ') || 'No information'}
                </p>
                <p className="mb-2">
                  <strong>Book detailed information: </strong>
                  <a href={`https://openlibrary.org${book.key}`} target="_blank" className="text-blue-600 hover:underline">
                    {book.title}
                  </a>
                </p>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded">
          Not founded the book detailed information
        </div>
      )}

      <div className="mt-4">
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-lg font-bold mb-0">📝 Review</h3>
          <select value={sortBy} onChange={e => setSortBy(e.target.value)}
            className="border border-gray-300 rounded px-2 py-1 text-sm" style={{ width: '150px' }}>
            <option value="latest">Lastest</option>
            <option value="likes">Likes</option>
            <option value="replies">Replies</option>
          </select>
        </div>
        
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm mb-3">
          <div className="p-4">
            <textarea value={currentReview} onChange={e => setCurrentReview(e.target.value)} placeholder="Please leave a review..."
              rows={3}
              className="w-full border border-gray-300 rounded px-3 py-2 mb-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <button onClick={submitReview} disabled={reviewAddMutation.isPending || !currentReview.trim()}
              className="bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded disabled:opacity-50 disabled:cursor-not-allowed">
              Register review
            </button>
          </div>
        </div>

        {currentItems.map(review => (
          <div key={review.id} className="bg-white border border-gray-200 rounded-lg shadow-sm mb-3">
            <div className="p-4">
              {editing !== review.id ? (
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <h6 className="text-sm text-gray-600 mb-0">
                      {review.userId} • {formatDate(review.createdAt)}
                    </h6>
                    {review.userId === username && (
                      <div className="flex gap-2">
                        <button onClick={() => startEdit(review)}
                          className="text-xs border border-blue-500 text-blue-500 hover:bg-blue-500 hover:text-white px-2 py-1 rounded"
                        >
                          Update
                        </button>
                        <button onClick={() => deleteReview(review.id)}
                          className="text-xs border border-red-500 text-red-500 hover:bg-red-500 hover:text-white px-2 py-1 rounded"
                        >
                          Delete
                        </button>
                      </div>
                    )}
                  </div>
                  <p className="mb-3">{review.content}</p>
                </div>
              ) : (
                <div className="mb-3">
                  <textarea value={editContent} onChange={e => setEditContent(e.target.value)} rows={3}
                    className="w-full border border-gray-300 rounded px-3 py-2 mb-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <button onClick={() => submitEdit(review.id)}
                    className="text-xs bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded mr-2"
                  >
                    Check
                  </button>
                  <button onClick={() => setEditing(null)}
                    className="text-xs bg-gray-500 hover:bg-gray-600 text-white px-3 py-1 rounded"
                  >
                    Cancel
                  </button>
                </div>
              )}

              <div className="flex gap-2 mb-2">
                <button onClick={() => toggleLike(review.id)}
                  className={`text-xs px-2 py-1 rounded border ${
                    review.likes.includes(authenticated ? username || getSessionId() : getSessionId()) 
                      ? 'bg-blue-500 text-white border-blue-500' 
                      : 'bg-white text-blue-500 border-blue-500 hover:bg-blue-500 hover:text-white'
                  }`}
                >
                  👍 Like ({review.likes.length})
                </button>
                <button onClick={() => startReply(review.id)}
                  className="text-xs bg-white text-gray-500 border border-gray-300 hover:bg-gray-50 px-2 py-1 rounded">
                  💬 Reply ({review.replies.length})
                </button>
              </div>

              {replyingTo === review.id && (
                <div className="mt-3">
                  <textarea value={replyContent} onChange={e => setReplyContent(e.target.value)} placeholder="Please leave a reply..."
                    rows={2}
                    className="w-full border border-gray-300 rounded px-3 py-2 mb-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <button onClick={() => submitReply(review.id)} disabled={replyAddMutation.isPending || !replyContent.trim()}
                    className="text-xs bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded mr-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Register reply
                  </button>
                  <button onClick={() => setReplyingTo(null)}
                    className="text-xs bg-gray-500 hover:bg-gray-600 text-white px-3 py-1 rounded"
                  >
                    Cancel
                  </button>
                </div>
              )}

              {review.replies && review.replies.length > 0 && review.replies.map((reply: Reply) => (
                <div key={reply.id} className="bg-gray-50 border border-gray-200 rounded p-3 mt-2 ml-4">
                  <div className="p-2">
                    {editingReply !== reply.id ? (
                      <div>
                        <div className="flex justify-between items-center">
                          <h6 className="text-xs text-gray-600 mb-1">
                            {reply.user?.username || reply.authorId || reply.userId || 'Unknown'} • {formatDate(reply.createdAt)}
                          </h6>
                          {(reply.user?.username === username || reply.authorId === username || reply.userId === username) && (
                            <div className="flex gap-2">
                              <button onClick={() => startEditReply(reply)}
                                className="text-xs border border-blue-500 text-blue-500 hover:bg-blue-500 hover:text-white px-2 py-1 rounded"
                              >
                                Update
                              </button>
                              <button onClick={() => deleteReply(review.id, reply.id)}
                                className="text-xs border border-red-500 text-red-500 hover:bg-red-500 hover:text-white px-2 py-1 rounded"
                              >
                                Delete
                              </button>
                            </div>
                          )}
                        </div>
                        <p className="mt-1 mb-0 text-sm">{reply.content}</p>
                      </div>
                    ) : (
                      <div className="mt-2">
                        <textarea value={editReplyContent} onChange={e => setEditReplyContent(e.target.value)} rows={2}
                          className="w-full border border-gray-300 rounded px-3 py-2 mb-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                        <div>
                          <button onClick={() => submitEditReply(reply.id)} disabled={!editReplyContent.trim()}
                            className="text-xs bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded mr-2 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            Check
                          </button>
                          <button onClick={() => setEditingReply(null)}
                            className="text-xs bg-gray-500 hover:bg-gray-600 text-white px-3 py-1 rounded"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}

        {totalPages > 1 && (
          <nav className="flex justify-center mt-4">
            <ul className="flex items-center">
              <li className={currentPage === 1 ? 'opacity-50' : ''}>
                <button onClick={() => setCurrentPage(currentPage - 1)} disabled={currentPage === 1}
                  className="px-3 py-2 text-sm border border-gray-300 rounded-l-md hover:bg-gray-50 disabled:cursor-not-allowed"
                >
                  Prev
                </button>
              </li>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                <li key={page}>
                  <button onClick={() => setCurrentPage(page)}
                    className={`px-3 py-2 text-sm border-t border-b border-r border-gray-300 hover:bg-gray-50 ${
                      currentPage === page ? 'bg-blue-500 text-white' : 'bg-white text-gray-700'
                    }`}
                  >
                    {page}
                  </button>
                </li>
              ))}
              <li className={currentPage === totalPages ? 'opacity-50' : ''}>
                <button onClick={() => setCurrentPage(currentPage + 1)} disabled={currentPage === totalPages}
                  className="px-3 py-2 text-sm border border-gray-300 rounded-r-md hover:bg-gray-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </li>
            </ul>
          </nav>
        )}
      </div>
    </div>
  );
};

export default Detail;