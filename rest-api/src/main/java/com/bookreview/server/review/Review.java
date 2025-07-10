package com.bookreview.server.review;

import com.bookreview.server.reply.Reply;
import com.bookreview.server.user.User;
import com.fasterxml.jackson.annotation.*;
import jakarta.persistence.Index;
import jakarta.persistence.Table;
import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "review", indexes = {
    @Index(name = "idx_bookid", columnList = "bookId")
})
public class Review {
  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  private String content;

  @JsonSetter(nulls = Nulls.SKIP) // null 값은 무시
  private LocalDateTime createdAt;
  
  private String bookId;

  @ElementCollection // likes는 String 타입의 리스트로, 사용자가 좋아요를 누른 리뷰의 ID를 저장
  @JsonProperty("likes") // JSON 직렬화 시 "likes"라는 이름으로 변환
  private List<String> likes= new ArrayList<>(); // 좋아요를 누른 리뷰의 ID를 저장하는 리스트

  @ManyToOne // 리뷰는 하나의 사용자에 속함
  @JsonIgnoreProperties({"hibernateLazyInitializer", "handler"}) // User 엔티티의 Lazy Loading을 방지하기 위한 설정
  private User user;

  @OneToMany(mappedBy = "review", cascade = CascadeType.ALL, orphanRemoval = true) // 리뷰에 대한 댓글을 저장하는 리스트
  private List<Reply> replies;

  public Review() {
    this.createdAt = LocalDateTime.now();
    this.likes = new ArrayList<>();
  }

  public Long getId() { return id; }
  public void setId(Long id) { this.id = id; }
  public String getContent() { return content; }
  public void setContent(String content) { this.content = content; }
  public LocalDateTime getCreatedAt() { return createdAt; }
  public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
  public String getBookId() { return bookId; }
  public void setBookId(String bookId) { this.bookId = bookId; }
  public List<String> getLikes() { return likes; }
  public void setLikes(List<String> likes) { this.likes = likes; }
  public User getUser() { return user; }
  public void setUser(User user) { this.user = user; }
  public List<Reply> getReplies() { return replies; }
  public void setReplies(List<Reply> replies) { this.replies = replies; }
}