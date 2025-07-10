package com.bookreview.server.jwt;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.oauth2.jwt.JwtClaimsSet;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.JwtEncoderParameters;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.stream.Collectors;

@Service
public class JwtTokenService {
  private final JwtEncoder jwtEncoder; // JWT 인코더

  public JwtTokenService(JwtEncoder jwtEncoder) {
    this.jwtEncoder = jwtEncoder;
  } // `jwtEncoder`를 초기화

  public String generateToken(Authentication authentication) { // 인증 정보를 바탕으로 JWT를 생성

    var scope = authentication
      .getAuthorities() // 인증된 사용자의 권한을 가져옴
      .stream() // 스트림으로 변환
      .map(GrantedAuthority::getAuthority) // 각 권한을 문자열로 변환
      .collect(Collectors.joining(" ")); // 인증된 사용자의 권한을 문자열로 결합
            
    var claims = JwtClaimsSet.builder() // JWT 클레임을 설정함
      .issuer("self") // 발급자를 "self"로 설정함
      .issuedAt(Instant.now()) // 발급 시간을 현재 시간으로 설정함
      .expiresAt(Instant.now().plus(90, ChronoUnit.MINUTES)) // 만료 시간을 90분 후로 설정함
      .subject(authentication.getName()) // 주체를 인증된 사용자 이름으로 설정함
      .claim("scope", scope) // 권한 범위를 설정함
      .build();

    return this.jwtEncoder
      .encode(JwtEncoderParameters.from(claims)) // JWT를 인코딩하고
      .getTokenValue(); // 토큰 값을 반환
  }
}
