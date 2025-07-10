export const getSessionId = (): string => { // 세션 ID를 가져오거나 생성하는 함수
  let sessionId = sessionStorage.getItem('sessionId');
  if (!sessionId) {
    sessionId = crypto.randomUUID();
    sessionStorage.setItem('sessionId', sessionId);
  }
  return sessionId;
};

export const generateSessionId = (): string => { // 인증하지 않은 사용자를 위한 세션 ID 생성 → 등록한 답글에서 답글을 등록한 사용자명이 표시되지 않는 오류가 자꾸 생겨서 수정 중에 추가한 함수
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};