package com.bookreview.server.jwt;

import com.bookreview.server.user.User;
import com.bookreview.server.user.UserRepository;
import com.nimbusds.jose.JOSEException;
import com.nimbusds.jose.jwk.JWKSet;
import com.nimbusds.jose.jwk.RSAKey;
import com.nimbusds.jose.jwk.source.JWKSource;
import com.nimbusds.jose.proc.SecurityContext;
import org.springframework.boot.autoconfigure.security.servlet.PathRequest;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.ProviderManager;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.annotation.web.configurers.HeadersConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder;
import org.springframework.security.oauth2.jwt.NimbusJwtEncoder;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationConverter;
import org.springframework.security.web.SecurityFilterChain;

import java.security.KeyPair;
import java.security.KeyPairGenerator;
import java.security.interfaces.RSAPrivateKey;
import java.security.interfaces.RSAPublicKey;
import java.util.UUID;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity // Spring Security 설정 클래스라는 뜻
public class JwtSecurityConfig {
  private final UserRepository userRepository;

  public JwtSecurityConfig(UserRepository userRepository) {
    this.userRepository = userRepository;
  }

  @Bean
  public SecurityFilterChain securityFilterChain(HttpSecurity httpSecurity) throws Exception { // `SecurityFilterChain` 빈을 정의하여 HTTP 보안 설정을 구성함
    return httpSecurity
      .authorizeHttpRequests(auth -> auth
        .requestMatchers("/authenticate", "/register").permitAll() // 인증과 등록 엔드포인트는 인증 없이 접근 허용
        .requestMatchers(HttpMethod.GET, "/reviews/**").permitAll()
        .requestMatchers(HttpMethod.GET, "/replies/**").permitAll()
        .requestMatchers(HttpMethod.PUT, "/reviews/*/like").permitAll() // 좋아요 토글하는 것은 인증 없이 접근 허용
        .requestMatchers(HttpMethod.POST, "/reviews/**").authenticated() // 리뷰 작성은 인증 필요
        .requestMatchers(HttpMethod.PUT, "/reviews/**").authenticated()
        .requestMatchers(HttpMethod.DELETE, "/reviews/**").authenticated()
        .requestMatchers(HttpMethod.POST, "/replies/**").authenticated()
        .requestMatchers(HttpMethod.PUT, "/replies/**").authenticated()
        .requestMatchers(HttpMethod.DELETE, "/replies/**").authenticated()
        .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll() // 모든 OPTIONS 요청 허용
        .anyRequest().authenticated()) // 나머지 모든 요청은 인증 필요
      .csrf(AbstractHttpConfigurer::disable) // CSRF 보호 비활성화
      .cors(Customizer.withDefaults()) // CORS 설정을 기본값으로 사용
      .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS)) // 세션 관리를 상태 비저장으로 설정
      .oauth2ResourceServer(oauth2 -> oauth2.jwt(jwt -> jwt.jwtAuthenticationConverter(jwtAuthenticationConverter()))) // JWT 인증을 사용하도록 설정
      .httpBasic(Customizer.withDefaults()) // 기본 HTTP 인증 사용
      .build();
  }

  @Bean
  public JwtAuthenticationConverter jwtAuthenticationConverter() { // JWT 인증 변환기를 설정
    JwtAuthenticationConverter converter = new JwtAuthenticationConverter(); // JWT를 인증으로 변환하는 변환기를 생성하고,
    converter.setPrincipalClaimName("sub"); // JWT의 "sub" 클레임을 주체 이름으로 설정하여
    return converter; // 변환기를 반환함
  }

  @Bean
  public AuthenticationManager authenticationManager(
      UserDetailsService userDetailsService,
      PasswordEncoder passwordEncoder) { // `AuthenticationManager` 빈을 정의하여 사용자 인증을 관리함
    var authenticationProvider = new DaoAuthenticationProvider(); // `DaoAuthenticationProvider`를 사용하여
    authenticationProvider.setUserDetailsService(userDetailsService); // 사용자 세부 정보를 설정하고,
    authenticationProvider.setPasswordEncoder(passwordEncoder); // 비밀번호 인코더 설정를 설정함
    return new ProviderManager(authenticationProvider); // `ProviderManager`를 사용하여 인증 제공자를 관리함
  }

  @Bean
  public UserDetailsService userDetailsService() { // `UserDetailsService` 빈을 정의하여 사용자 세부 정보를 불러옴
    return username -> {
      User user = userRepository.findByUsername(username); // 사용자 이름으로 `UserRepository`에서 사용자 정보를 찾고,
      if (user == null) {
        throw new org.springframework.security.core.userdetails.UsernameNotFoundException("User not found: " + username);
      } // 찾지 못하면 예외를 발생시킴
      return org.springframework.security.core.userdetails.User // `User` 객체를 사용하여 사용자 세부 정보를 생성
        .withUsername(user.getUsername())
        .password(user.getPassword())
        .authorities("USER")
        .build();
    };
  }

  /* jwt 인증, jwk 리소스 설정하는 로직 순서 */
  @Bean
  public KeyPair keyPair() {
    try {
      var keyPairGenerator = KeyPairGenerator.getInstance("RSA");
      keyPairGenerator.initialize(2048);
      return keyPairGenerator.generateKeyPair();
    } catch (Exception e) {
      throw new IllegalStateException("Unable to generate an RSA Key Pair", e);
    }
  } // 1. 키 엔트리쌍을 사용하여 RSA 키 객체를 생성하기 위해 작성

  @Bean
  public RSAKey rsaKey(KeyPair keyPair) {
    return new RSAKey
      .Builder((RSAPublicKey) keyPair.getPublic())
      .privateKey((RSAPrivateKey) keyPair.getPrivate())
      .keyID(UUID.randomUUID().toString())
      .build();
  } // 2. RSA 키 엔트리쌍 생성을 위해 작성

  @Bean
  public JWKSource<SecurityContext> jwkSource(RSAKey rsaKey) {
    JWKSet jwkSet = new JWKSet(rsaKey);
    return (((jwkSelector, securityContext) -> jwkSelector.select(jwkSet)));
  } // 3. Json Web Key 소스를 생성하기 위해 작성

  @Bean
  JwtDecoder jwtDecoder(RSAKey rsaKey) throws JOSEException {
    return NimbusJwtDecoder
      .withPublicKey(rsaKey.toRSAPublicKey())
      .build();
  } // 4. 디코딩을 위한 RSA 공개 키를 사용하기 위해 작성

  @Bean
  JwtEncoder jwtEncoder(JWKSource<SecurityContext> jwkSource) {
    return new NimbusJwtEncoder(jwkSource);
  } // 5. JWT 인증 설정에서 인코더 생성을 위해 작성

  @Bean
  public PasswordEncoder passwordEncoder() { // 비밀번호 인코더를 설정
    return new BCryptPasswordEncoder(); // BCrypt 해시 알고리즘을 사용하여 비밀번호를 인코딩
  }
}