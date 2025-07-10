package com.bookreview.server.reply;

import com.bookreview.server.review.Review;
import com.bookreview.server.user.User;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "reply")
public class Reply {
  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  private String content;
  private LocalDateTime createdAt;

  @ManyToOne
  @JsonIgnore // 직렬화에서 제외
  private User user;

  @ManyToOne
  @JsonIgnore
  private Review review;

  @Transient // 데이터베이스에 저장되지 않음
  private Long reviewId;

  @PostLoad // 엔티티가 로드된 후에 호출되는 메서드
  public void populateTransientFields() { // reviewId를 설정
    this.reviewId = review != null ? review.getId() : null; // review가 null이 아니면 reviewId를 설정
  }

  @JsonProperty("user") // JSON 직렬화시 사용되는 메서드
  public Object getUserForSerialization() { // 사용자 정보를 직렬화할 때 사용
    return user != null ? new UserSummary(user.getUsername()) : new UserSummary("Unknown"); // 사용자 정보가 없으면 "Unknown"으로 설정
  }

  public static class UserSummary { // 사용자 정보를 요약해서 보여주는 클래스
    private final String username; // 사용자 이름만 포함

    public UserSummary(String username) {
      this.username = username;
    }

    public String getUsername() {
      return username;
    }
  }

  public Reply() {
    this.createdAt = LocalDateTime.now(); // 기본 생성자에서 createdAt을 현재 시간으로 설정
  }

  public User getUser() { return user; }
  public void setUser(User user) { this.user = user; }
  public Review getReview() { return review; }
  public void setReview(Review review) { this.review = review; }
  public String getContent() { return content; }
  public void setContent(String content) { this.content = content; }
  public LocalDateTime getCreatedAt() { return createdAt; }
  public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
  public Long getId() { return id; }
}