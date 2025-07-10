package com.bookreview.server.user;

import org.springframework.data.jpa.repository.JpaRepository;

public interface UserRepository extends JpaRepository<User, Long> { // JpaRepository 는 crud 기능을 자동으로 제공
  User findByUsername(String username); // 사용자명으로 사용자 정보를 조회
}