package com.bookreview.server.reply;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.oauth2.jwt.Jwt;

import java.util.List;

@RestController
public class ReplyController {
  private final ReplyService replyService; // 답글 관련 서비스 상수

  public ReplyController(ReplyService replyService) {
    this.replyService = replyService;
  }
  @GetMapping("/replies")
  public List<Reply> readReplies() {
    return replyService.readReplies(); // 답글 목록 반환
  }

  @PostMapping("/replies/{reviewId}")
  public ResponseEntity<?> createReply(@PathVariable Long reviewId, @RequestBody Reply reply, @AuthenticationPrincipal Object principal) {
    String username = extractUsername(principal); // 인증된 사용자의 이름을 추출

    if (username == null) { // principal이 Jwt 또는 UserDetails가 아닌 경우
      return ResponseEntity.status(401).body("Unauthorized: Invalid principal"); // 401 Unauthorized 응답 반환
    }

    return replyService.createReply(reviewId, reply, username); // 답글 등록 요청 처리
  }

  @PutMapping("/replies/{reviewId}")
  public ResponseEntity<?> updateReply(@PathVariable Long reviewId, @RequestBody Reply updatedReply, @AuthenticationPrincipal Object principal) {
    String username = extractUsername(principal);

    if (username == null) {
      return ResponseEntity.status(401).body("Unauthorized: Invalid principal");
    }

    return replyService.updateReply(reviewId, updatedReply, username); // 답글 수정 요청 처리
  }

  @DeleteMapping("/replies/{reviewId}/{replyId}")
  public ResponseEntity<?> deleteReply(@PathVariable Long reviewId, @PathVariable Long replyId, @AuthenticationPrincipal Object principal) {
    String username = extractUsername(principal);

    if (username == null) {
      return ResponseEntity.status(401).body("Unauthorized: Invalid principal");
    }

    return replyService.deleteReply(reviewId, replyId, username); // 답글 삭제 요청 처리
  }

  private String extractUsername(Object principal) { // 인증된 사용자의 이름을 추출하는 메서드
    if (principal instanceof Jwt) { // principal이 Jwt 인스턴스인 경우
      return ((Jwt) principal).getClaimAsString("sub"); // Jwt에서 사용자 이름을 추출
    } else if (principal instanceof UserDetails) { // principal이 UserDetails 인스턴스인 경우
      return ((UserDetails) principal).getUsername(); // UserDetails에서 사용자 이름을 추출
    }

    return null; // principal이 Jwt 또는 UserDetails가 아닌 경우 null 반환
  }
}
