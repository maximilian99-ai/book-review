package com.bookreview.server.jwt;

public record JwtTokenRequest(String username, String password) {} // 사용자 이름, 비밀번호로 JWT 토큰 요청을 나타내는 레코드
