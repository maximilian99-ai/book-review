export const formatDate = (dateString: string): string => { // 날짜 포맷팅 함수 → 좋아요 버튼을 클릭하면 서버와 날짜/시간 데이터 형식이 안 맞다는 오류가 자꾸 생겨서 수정 중에 추가한 함수
  const date = new Date(dateString); // ISO 8601 형식의 날짜 문자열을 Date 객체로 변환
  return date instanceof Date && !isNaN(Number(date)) // 날짜 유효성 확인
    ? date.toLocaleDateString('en-GB', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric', hour12: false }).replace(/\//g, '/') // 유효하면 유럽 형식으로 포맷팅
    : 'Date information unavailable'; // 유효하지 않은 날짜
};