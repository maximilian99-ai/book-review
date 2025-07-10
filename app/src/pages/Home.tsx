import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import type { Book } from '../utils/type';
import { getSessionValue } from '../utils/sessionValue';

const Home: React.FC = () => {
  const [books, setBooks] = useState<Book[]>([]); // 도서 목록
  const [loading, setLoading] = useState(true); // 로딩 상태
  const [showErrorMessage, setShowErrorMessage] = useState(false); // 에러 메시지 표시 여부
  const [currentPage, setCurrentPage] = useState<number>( // 현재 페이지
    Number(getSessionValue('currentPage', '1'))
  );
  const [itemsPerPage, setItemsPerPage] = useState<number>( // 페이지당 항목 수
    Number(getSessionValue('itemsPerPage', '5'))
  );
  const [searchTerm, setSearchTerm] = useState<string>( // 검색어
    getSessionValue('searchTerm', '')
  );

  useEffect(() => {
    axios.get('https://openlibrary.org/search.json?q=frontend') // Open Library API를 통해 도서 목록을 가져옴
      .then(response => {
        setBooks(response.data.docs); // 도서 목록을 books 변수에 저장
        setLoading(false);
      })
      .catch(() => {
        setShowErrorMessage(true);
        setLoading(false);
      });
  }, []);

  useEffect(() => { // 상태 변경시 세션 스토리지에 저장
    sessionStorage.setItem('currentPage', String(currentPage));
    sessionStorage.setItem('itemsPerPage', String(itemsPerPage));
    sessionStorage.setItem('searchTerm', searchTerm);
  }, [currentPage, itemsPerPage, searchTerm]);

  const filteredLists = useMemo(() => { // 검색어를 기반으로 필터링된 도서 목록을 반환
    return books.filter(book =>
      book.title?.toLowerCase().includes(searchTerm.toLowerCase()) || // 도서 제목에 검색어가 포함된 경우
      book.author_name?.join(', ').toLowerCase().includes(searchTerm.toLowerCase()) // 저자 이름에 검색어가 포함된 경우
    );
  }, [books, searchTerm]);

  const totalPages = useMemo(() => Math.ceil(filteredLists.length / itemsPerPage), [filteredLists, itemsPerPage]);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredLists.slice(indexOfFirstItem, indexOfLastItem);

  const handlePageChange = (pageNumber: number) => { // 페이지 변경 핸들러
    setCurrentPage(pageNumber);
  };

  const handleItemsPerPageChange = (e: React.ChangeEvent<HTMLSelectElement>) => { // 페이지당 항목 수 변경 핸들러
    setItemsPerPage(Number(e.target.value));
    setCurrentPage(1);
  };

  const handlePrevPage = () => { // 이전 페이지로 이동
    if (currentPage > 1) setCurrentPage(prev => prev - 1);
  };

  const handleNextPage = () => { // 다음 페이지로 이동
    if (currentPage < totalPages) setCurrentPage(next => next + 1);
  };

  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) { // 현재 페이지가 총 페이지 수보다 크면
      setCurrentPage(1);
    }// eslint-disable-next-line
  }, [totalPages]);

  return (
    <div className="container my-8">
      <h1 className="mb-6 text-center text-3xl font-bold">📚 Book List</h1>
      
      <div className="mb-4 flex justify-center">
        <input type="text" placeholder="🔍 Input author or book name you wanna search..." value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)} className="form-control max-w-md"
        />
      </div>

      {loading ? (
        <div className="flex justify-center my-8">
          <div className="spinner-border text-blue-500"></div>
          <span className="sr-only">Loading...</span>
          {showErrorMessage && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              Book datas haven't been loaded from the Open Library API. Please connect again!
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
          {currentItems.map(book => (
            <Link key={book.key} to={`/detail${book.key}`} className="block no-underline">
              <div className="card hover:shadow-lg transition-shadow h-full flex flex-col overflow-hidden">
                <img src={book.cover_i ? `https://covers.openlibrary.org/b/id/${book.cover_i}-M.jpg`
                    : 'https://placehold.co/400x300?text=No+Image'} alt={book.title} className="w-full h-60 object-cover"
                />
                <div className="card-body flex-1 flex flex-col">
                  <h4 className="font-bold text-lg mb-2 text-gray-900">{book.title}</h4>
                  <div className="text-sm text-gray-600 space-y-1 flex-1">
                    <p><strong>Author:</strong> {book.author_name?.join(', ') || 'No information'}</p>
                    <p><strong>Publisher:</strong> {book.publisher?.[0] || 'No information'}</p>
                    <p><strong>Published year:</strong> {book.first_publish_year || 'No information'}</p>
                    <p><strong>Language:</strong> {book.language?.join(', ') || 'No information'}</p>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      <div className="flex flex-col items-center mt-6 space-y-4">
        <div>
          <select value={itemsPerPage} onChange={handleItemsPerPageChange} className="form-select w-auto">
            <option value={5}>View 5 items</option>
            <option value={10}>View 10 items</option>
            <option value={20}>View 20 items</option>
          </select>
        </div>
        
        {totalPages > 1 && (
          <nav className="flex justify-center">
            <ul className="pagination">
              <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                <button onClick={handlePrevPage} disabled={currentPage === 1} className="page-link">
                  Prev
                </button>
              </li>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(number => (
                <li key={number} className={`page-item ${currentPage === number ? 'active' : ''}`}>
                  <button onClick={() => handlePageChange(number)} className="page-link" >
                    {number}
                  </button>
                </li>
              ))}
              <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                <button onClick={handleNextPage} disabled={currentPage === totalPages || totalPages === 0}className="page-link">
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

export default Home;