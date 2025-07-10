package com.bookreview.server.jwt;

import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class JwtAuthenticationController {
  private final JwtTokenService tokenService; // JWT를 생성하는 서비스

  private final AuthenticationManager authenticationManager; // 인증을 관리

  public JwtAuthenticationController(JwtTokenService tokenService,
		AuthenticationManager authenticationManager) {
    this.tokenService = tokenService;
    this.authenticationManager = authenticationManager;
  } // `tokenService`와 `authenticationManager`를 초기화

  @PostMapping("/authenticate") // `/authenticate` 경로로 POST 요청이 들어오면 JWT를 생성
  public ResponseEntity<JwtTokenResponse> generateToken(
		@RequestBody JwtTokenRequest jwtTokenRequest) { // 요청 본문에서 `JwtTokenRequest` 객체를 받음

    var authenticationToken =
			new UsernamePasswordAuthenticationToken(
				jwtTokenRequest.username(),
				jwtTokenRequest.password()); // 사용자 이름과 비밀번호로 인증 토큰을 생성

    var authentication =
			authenticationManager.authenticate(authenticationToken); // 인증을 수행

    var token = tokenService.generateToken(authentication); // 인증 정보를 바탕으로 JWT를 생성

    return ResponseEntity.ok(new JwtTokenResponse(token)); // 생성된 토큰을 포함한 응답을 반환
  }
}
