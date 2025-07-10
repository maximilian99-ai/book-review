package com.bookreview.server.user;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

@RestController // @ResponseBody + @Controller: 자바 객체의 응답 데이터를 화면에 JSON 형식으로 전송하는 컨트롤러
public class UserController {
  private final UserService userService; // 사용자 관련 서비스 상수

  public UserController(UserService userService) { // 생성자 초기화
    this.userService = userService;
  }
  
  @PostMapping("/register")
  public ResponseEntity<?> registerUser(@RequestBody User user) {
    try {
      User savedUser = userService.registerUser(user); // 사용자 등록 서비스 호출
      return ResponseEntity.ok(savedUser); // 서버에서 성공적으로 처리하면 사용자 데이터를 저장하여 반환
    } catch (RuntimeException e) {
      return ResponseEntity.badRequest().body(e.getMessage()); // 오류 발생시 400 Bad Request 응답을 반환
    }
  }
}
