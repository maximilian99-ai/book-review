package com.bookreview.server.user;

import org.springframework.stereotype.Service;
import org.springframework.security.crypto.password.PasswordEncoder;

@Service // 서비스 클래스를 나타냄
public class UserService {
	private final UserRepository userRepository; // 사용자 데이터를 db에서 조회하거나 저장하는 상수
	private final PasswordEncoder passwordEncoder; // 비밀번호를 인코딩하는 상수

	public UserService(UserRepository userRepository, PasswordEncoder passwordEncoder) { // 생성자 초기화
		this.userRepository = userRepository;
		this.passwordEncoder = passwordEncoder;
	}

	public User registerUser(User user) {
		if (userRepository.findByUsername(user.getUsername()) != null) { // 사용자명이 존재하면
			throw new RuntimeException("Username already exists"); // 400 Bad Request 예외 발생
		}
		
		user.setPassword(passwordEncoder.encode(user.getPassword())); // 비밀번호는 PasswordEncoder로 인코딩하고
		
		return userRepository.save(user); // 사용자 정보를 db에 저장하고 반환
	}
}
