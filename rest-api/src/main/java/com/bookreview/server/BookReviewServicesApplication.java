package com.bookreview.server;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@SpringBootApplication
public class BookReviewServicesApplication {
	public static void main(String[] args) {
		SpringApplication.run(BookReviewServicesApplication.class, args);
	}
	
	//http://localhost:3000/ to 8080
	//Cross Origin Requests
	//Allow all requests only from http://localhost:3000/
	
	@Bean
	public WebMvcConfigurer corsConfigurer() {
		return new WebMvcConfigurer() {
			public void addCorsMappings(CorsRegistry registry) {
				registry.addMapping("/**") // 모든 경로에 대해 CORS 설정
					.allowedMethods("*") // 모든 HTTP 메서드 허용
					.allowedOrigins("http://localhost:3000") // 허용할 출처
					.allowedHeaders("*") // 모든 헤더 허용
					.allowCredentials(true) // 추가: 인증 정보 허용
					.exposedHeaders("*"); // 추가: 모든 헤더 노출
			}
		};
	}
}
