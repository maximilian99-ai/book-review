import React, { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { useAuthStore } from '../stores/useAuthStore';
import { createReviewApi, readAllReviewsApi, updateReviewApi, deleteReviewApi, createReplyApi, readAllRepliesApi, updateReplyApi, deleteReplyApi } from '../apis/DetailApiService';
import { getSessionId, generateSessionId } from '../utils/sessionId';
import { formatDate } from '../utils/formDate';
import type { Book, Review, Reply } from '../utils/type';

const Detail: React.FC = () => {
  const { id } = useParams<{ id: string }>(); // URL 패러미터에서 도서 ID를 가져옴
  const [book, setBook] = useState<Book | null>(null); // 도서 정보
  const [loading, setLoading] = useState(true); // 로딩 상태
  const { authenticated, username } = useAuthStore(); // 인증 상태와 사용자명
  const [reviews, setReviews] = useState<Review[]>([]); // 리뷰 목록
  const [currentReview, setCurrentReview] = useState(''); // 현재 리뷰 내용
  const [replies, setReplies] = useState<Reply[]>([]); // 답글 목록
  const [replyContent, setReplyContent] = useState(''); // 현재 답글 내용
  const [replyingTo, setReplyingTo] = useState<number | null>(null); // 답글을 달고 있는 리뷰 ID
  const [editing, setEditing] = useState<number | null>(null); // 수정 중인 리뷰 ID
  const [editContent, setEditContent] = useState(''); // 수정 중인 리뷰 내용
  const [editingReply, setEditingReply] = useState<number | null>(null); // 수정 중인 답글 ID
  const [editReplyContent, setEditReplyContent] = useState(''); // 수정 중인 답글 내용
  const [sortBy, setSortBy] = useState('latest'); // 정렬 기준 (최신순)
  const [currentPage, setCurrentPage] = useState(1); // 현재 페이지
  const [itemsPerPage, setItemsPerPage] = useState(5); // 페이지당 항목 수

  const sessionId = sessionStorage.getItem('sessionId') || generateSessionId(); // 세션 ID를 세션 스토리지에 저장
  if (!sessionStorage.getItem('sessionId')) { // 세션 ID가 없으면 새로 생성
    sessionStorage.setItem('sessionId', sessionId); // 세션 스토리지에 저장
  }

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

      await loadReviewsAndReplies();
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

  const start = (currentPage - 1) * itemsPerPage;
  const end = start + itemsPerPage;
  const currentItems = sortedReviews.slice(start, end);
  const totalPages = Math.ceil(sortedReviews.length / itemsPerPage);

  const submitReview = async (e: React.FormEvent) => { // 리뷰 등록 핸들러
    e.preventDefault();

    try {
      const token = sessionStorage.getItem('token');
      if (!authenticated || !token) {
        alert('You are not signed in, your token is missing or invalid');
        return;
      }

      const review = { // 리뷰 객체 생성
        bookId: id || '', // 도서 ID
        content: currentReview, // 리뷰 내용
        likes: [] // 좋아요 목록
      };
      const response = await createReviewApi(review); // 리뷰 등록 API 호출

      if (response.status === 200 || response.status === 201) {
        alert('Your review has been successfully registered!');
        setCurrentReview('');
        await loadReviewsAndReplies();
        setSortBy('latest');
        setCurrentPage(1);
      } else {
        alert('Failed to register review. Please try again.');
      }
    } catch (error: any) {
      console.error('Failed to register review:', error.response?.data || error);
      alert('Failed to register review: ' + (error.response?.data?.error || 'Server error'));
    }
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
        await loadReviewsAndReplies();
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

  const submitReply = async (reviewId: number) => { // 답글 등록 핸들러
    try {
      const token = sessionStorage.getItem('token');
      if (!authenticated || !token) {
        alert('You are not signed in, your token is missing or invalid');
        return;
      }

      const reply = { // 답글 객체 생성
        content: replyContent // 답글 내용
      };
      const response = await createReplyApi(reviewId, reply); // 답글 등록 API 호출
      
      if (response.status === 200 || response.status === 201) {
        setReplyingTo(null);
        setReplyContent('');
        await loadReviewsAndReplies();
      }
    } catch (error: any) {
      console.error('Failed to register reply:', error);
      alert('Failed to register reply: ' + (error.response?.data?.error || 'Server error'));
    }
  };

  const startEdit = (review: Review) => { // 리뷰 수정 시작 핸들러
    if (!authenticated) {
      alert('This service requires login.');
      return;
    }
    setEditing(review.id);
    setEditContent(review.content);
  };

  const submitEdit = async (reviewId: number) => { // 리뷰 수정 핸들러
    try {
      const token = sessionStorage.getItem('token');
      if (!authenticated || !token) {
        alert('You are not signed in, your token is missing or invalid');
        return;
      }

      const review = reviews.find(r => r.id === reviewId); // 수정할 리뷰 찾기
      if (!review) return;

      const updatedReview = { // 수정된 리뷰 객체 생성
        content: editContent, // 수정된 리뷰 내용
        bookId: review.bookId, // 도서 ID
        likes: review.likes, // 좋아요 목록
        createdAt: review.createdAt, // 생성 날짜
        replies: review.replies // 답글 목록
      };
      await updateReviewApi(reviewId, updatedReview); // 리뷰 수정 API 호출
      setEditing(null);
      setEditContent('');
      await loadReviewsAndReplies();
    } catch (error: any) {
      console.error('Failed to modify review:', error);
      alert('Failed to modify review: ' + (error.response?.data?.error || 'Server error'));
    }
  };

  const startEditReply = (reply: Reply) => { // 답글 수정 시작 핸들러
    if (!authenticated) {
      alert('This service requires login.');
      return;
    }
    setEditingReply(reply.id);
    setEditReplyContent(reply.content);
  };

  const submitEditReply = async (reviewId: number, replyId: number) => { // 답글 수정 핸들러
    try {
      const token = sessionStorage.getItem('token');
      if (!authenticated || !token) {
        alert('You are not signed in, your token is missing or invalid');
        return;
      }

      const reply = { // 수정된 답글 객체 생성
        content: editReplyContent // 수정된 답글 내용
      };
      const response = await updateReplyApi(replyId, reply); // 답글 수정 API 호출
      const review = reviews.find(r => r.id === reviewId); // 수정하려는 답글을 포함하는 리뷰 찾기
    
      if (review && response) { // 수정하려는 답글과 이를 포함하는 리뷰가 존재하는 경우
        const replyIndex = review.replies.findIndex(r => r.id === replyId); // 답글 인덱스 찾기
        if (replyIndex !== -1) { // 답글이 존재하는 경우
          review.replies[replyIndex] = { // 수정된 답글로 교체
            reviewId,
            id: replyId,
            content: editReplyContent,
            userId: username ?? undefined,
            authorId: username ?? '',
            createdAt: new Date().toISOString()
          };
        }
      }

      setEditingReply(null);
      setEditReplyContent('');

      await loadReviewsAndReplies();
    } catch (error: any) {
      console.error('Failed to modify reply:', error);
      alert('Failed to modify reply: ' + (error.response?.data?.error || 'Server error'));
    }
  };

  const deleteReview = async (reviewId: number) => { // 리뷰 삭제 핸들러
    try {
      const token = sessionStorage.getItem('token');
      if (!authenticated || !token) {
        alert('You are not signed in, your token is missing or invalid');
        return;
      }

      if (confirm('Are you sure you wanna delete your review?')) {
        await deleteReviewApi(reviewId); // 리뷰 삭제 API 호출
        await loadReviewsAndReplies();
      }
    } catch (error: any) {
      console.error('Failed to delete review:', error);
      alert('Failed to delete review: ' + (error.response?.data?.error || 'Server error'));
    }
  };

  const deleteReply = async (reviewId: number, replyId: number) => { // 답글 삭제 핸들러
    try {
      const token = sessionStorage.getItem('token');
      if (!authenticated || !token) {
        alert('You are not signed in, your token is missing or invalid');
        return;
      }
      
      if (confirm('Are you sure you wanna delete your reply?')) {
        await deleteReplyApi(reviewId, replyId); // 답글 삭제 API 호출
        await loadReviewsAndReplies();
      }
    } catch (error: any) {
      console.error('Failed to delete reply:', error);
      alert('Failed to delete reply: ' + (error.response?.data?.error || 'Server error'));
    }
  };

  const loadReviewsAndReplies = async () => { // 리뷰와 답글 불러오는 함수
    try {
      const workKey = id || '';
      const [reviewsResponse, repliesResponse] = await Promise.all([ // 리뷰와 답글을 동시에 불러오기 → bookId 동적 패러미터와 실제 응답 데이터의 replies 정보의 패러미터가 상이한 이유로 등록한 답글이 화면 요소에 표시되지 않는 오류가 자꾸 생겨서 수정함
        readAllReviewsApi(workKey), // 리뷰 API 호출
        readAllRepliesApi() // 답글 API 호출
      ]);

      setReviews([...(reviewsResponse.data || []).map((review: any) => ({ // 리뷰 목록 가공
        id: review.id, // 리뷰 ID
        content: review.content, // 리뷰 내용
        bookId: review.bookId, // 도서 ID
        likes: Array.isArray(review.likes) ? review.likes : [], // 좋아요 목록
        createdAt: review.createdAt, // 생성 날짜
        replies: Array.isArray(review.replies) ? review.replies : [], // 답글 목록
        userId: review.user?.username || review.username || 'Unknown' // 사용자명 → 사용자명에 해당하는 클라이언트의 객체 프로퍼티에 대해 서버의 사용자 정보에 해당하는 데이터를 제공하지 않아서 등록한 답글이 화면 요소에 표시되지 않는 오류가 자꾸 생겨서 수정함
      }))]);

      setReplies(repliesResponse.data || []); // 답글 목록 저장
    } catch (error) {
      console.error('Failed to load the reviews and replies:', error);
    }
  };

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
            <button onClick={submitReview} disabled={!currentReview.trim()}
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
                  <button onClick={() => submitReply(review.id)} disabled={!replyContent.trim()}
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

              {review.replies && review.replies.length > 0 && review.replies.map(reply => (
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
                          <button onClick={() => submitEditReply(review.id, reply.id)} disabled={!editReplyContent.trim()}
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