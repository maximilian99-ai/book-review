package com.bookreview.server.reply;

import com.bookreview.server.review.Review;
import com.bookreview.server.review.ReviewRepository;
import com.bookreview.server.user.User;
import com.bookreview.server.user.UserRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@Transactional
public class ReplyService {
	private final ReplyRepository replyRepository;
	private final ReviewRepository reviewRepository;
	private final UserRepository userRepository;

	public ReplyService(ReplyRepository replyRepository, ReviewRepository reviewRepository, UserRepository userRepository) {
		this.replyRepository = replyRepository;
		this.reviewRepository = reviewRepository;
		this.userRepository = userRepository;
	}

	public List<Reply> readReplies() {
		return replyRepository.findAll(); // 모든 답글을 조회하여 반환
	}

	public ResponseEntity<?> createReply(Long reviewId, Reply reply, String username) {
		try {
			User user = userRepository.findByUsername(username); // 사용자 이름으로 사용자를 찾음
			
			if (user == null) {
				return ResponseEntity.badRequest().body("User not found");
			}

			Review review = reviewRepository.findById(reviewId).orElse(null); // 리뷰 ID로 리뷰를 찾음

			if (review == null) {
				return ResponseEntity.badRequest().body("Review not found");
			}

			reply.setUser(user); // 답글에 사용자 정보를 설정
			reply.setReview(review); // 답글에 리뷰 정보를 설정
			reply.setCreatedAt(LocalDateTime.now()); // 답글 생성 시간을 현재 시간으로 설정

			Reply savedReply = replyRepository.save(reply); // 답글을 저장
			return ResponseEntity.ok(savedReply); // 성공적으로 저장된 답글을 반환
		} catch (Exception e) {
			e.printStackTrace(); // 예외 발생시 스택 트레이스 출력
			return ResponseEntity.status(500).body("Internal Server Error: " + e.getMessage()); // 내부 서버 오류 발생시 에러 메시지를 반환
		}
	}

	public ResponseEntity<?> updateReply(Long reviewId, Reply updatedReply, String username) {
		try {
			User user = userRepository.findByUsername(username);

			if (user == null) {
				return ResponseEntity.badRequest().body("User not found");
			}

			Reply existingReply = replyRepository.findById(reviewId).orElse(null); // 리뷰 ID로 존재하는 답글을 찾음

			if (existingReply == null) { // 답글이 존재하지 않는 경우
				return ResponseEntity.notFound().build(); // 404 Not Found 응답을 반환
			}

			if (!existingReply.getUser().getUsername().equals(username)) { // 답글 작성자와 현재 사용자 이름이 다른 경우
				return ResponseEntity.status(403).body("Forbidden: You can only edit your own replies"); // 403 Forbidden 응답을 반환
			}

			existingReply.setContent(updatedReply.getContent()); // 답글 내용을 수정
			return ResponseEntity.ok(replyRepository.save(existingReply)); // 수정된 답글을 저장하고 반환
		} catch (Exception e) {
			e.printStackTrace();
			return ResponseEntity.status(500).body("Internal Server Error: " + e.getMessage());
		}
	}

	public ResponseEntity<?> deleteReply(Long reviewId, Long replyId, String username) {
		try {
			User user = userRepository.findByUsername(username);

			if (user == null) {
				return ResponseEntity.badRequest().body("User not found");
			}

			Reply reply = replyRepository.findById(replyId).orElse(null); // 답글 ID로 답글을 찾음
			Review review = reviewRepository.findById(reviewId).orElse(null); // 리뷰 ID로 리뷰를 찾음

			if (reply == null || review == null) { // 답글이나 리뷰가 존재하지 않는 경우
				return ResponseEntity.notFound().build(); // 404 Not Found 응답을 반환
			}

			if (!reply.getUser().getUsername().equals(username)) { // 답글 작성자와 현재 사용자 이름이 다른 경우
				return ResponseEntity.status(403).body("Forbidden: You can only delete your own replies"); // 403 Forbidden 응답을 반환
			}

			replyRepository.delete(reply); // 답글 삭제
			return ResponseEntity.noContent().build(); // 204 No Content 응답을 반환
		} catch (Exception e) {
			e.printStackTrace();
			return ResponseEntity.status(500).body("Internal Server Error: " + e.getMessage());
		}
	}
}
