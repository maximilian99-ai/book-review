package com.bookreview.server.review;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.List;

@RestController
public class ReviewController {
	private final ReviewService reviewService; // 리뷰 관련 서비스 상수

	public ReviewController(ReviewService reviewService) {
		this.reviewService = reviewService;
	}

	@GetMapping("/reviews")
	public List<Review> readReviews(@RequestParam(required = false) String bookId) {
		return reviewService.readReviews(bookId); // 리뷰 목록 요청 처리
	}

	@PostMapping("/reviews")
	public ResponseEntity<?> createReview(@RequestBody Review review, @AuthenticationPrincipal Jwt jwt) {
		return reviewService.createReview(review, jwt); // 리뷰 등록 요청 처리
	}

	@PutMapping("/reviews/{id}")
	public ResponseEntity<?> updateReview(@PathVariable Long id, @RequestBody Review updatedReview, @AuthenticationPrincipal Jwt jwt) {
		return reviewService.updateReview(id, updatedReview, jwt); // 리뷰 수정 요청 처리
	}

	@PutMapping("/reviews/{id}/like")
	public ResponseEntity<?> toggleLike(@PathVariable Long id, @RequestBody List<String> newLikes) {
		return reviewService.toggleLike(id, newLikes); // 리뷰 좋아요 토글 요청 처리
	}

	@DeleteMapping("/reviews/{id}")
	public ResponseEntity<?> deleteReview(@PathVariable Long id, @AuthenticationPrincipal Jwt jwt) {
		return reviewService.deleteReview(id, jwt); // 리뷰 삭제 요청 처리
	}
}