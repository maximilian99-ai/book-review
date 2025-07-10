package com.bookreview.server.user;

import jakarta.persistence.*;

@Entity // jpa 엔티티 클래스라는 것을 나타냄
@Table(name = "users") // 이 엔티티가 매핑될 테이블 이름을 users로 지정
public class User {
  @Id // 필드를 기본 키로 지정
  @GeneratedValue(strategy = GenerationType.IDENTITY) // 자동 증가
  private Long id;

  @Column(unique = true) // 사용자명은 유일해야함을 명시
  private String username;
  private String password;
  
  public User() {} // 기본 생성자

  /* getter와 setter */
  public Long getId() { return id; }
  public void setId(Long id) { this.id = id; }
  public String getUsername() { return username; }
  public void setUsername(String username) { this.username = username; }
  public String getPassword() { return password; }
  public void setPassword(String password) { this.password = password; }
} 