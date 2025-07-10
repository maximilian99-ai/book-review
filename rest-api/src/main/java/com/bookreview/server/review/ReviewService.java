package com.bookreview.server.review;

import com.bookreview.server.user.User;
import com.bookreview.server.user.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;

@Service
public class ReviewService {
	private final ReviewRepository reviewRepository;
	private final UserRepository userRepository;

	public ReviewService(ReviewRepository reviewRepository, UserRepository userRepository) {
		this.reviewRepository = reviewRepository;
		this.userRepository = userRepository;
	}

	public List<Review> readReviews(String bookId) {
		List<Review> reviews = bookId != null && !bookId.isEmpty() // bookId가 있으면
			? reviewRepository.findByBookId(bookId) // 해당 도서의 리뷰를 찾음
			: new ArrayList<>(); // 없으면 빈 리스트 반환
		
		// for (Review review : reviews) { // 각 리뷰에 대한 답글 목록도 함께 로드
		// 	if (review.getReplies() != null) {
		// 		review.getReplies().size(); // Lazy loading 강제 실행
		// 	}
		// }
		
		return reviews;
	}

	public ResponseEntity<?> createReview(Review review, Jwt jwt) {
		try {
			if (jwt == null) { // JWT가 없으면
				return ResponseEntity
					.status(HttpStatus.UNAUTHORIZED) // 401 Unauthorized 응답
					.body(new HashMap<String, String>() {{ // 응답 본문에 에러 메시지 포함
						put("error", "Unauthorized: Login is required");
						put("status", "401");
					}});
			}

			String username = jwt.getSubject(); // JWT에서 사용자 이름을 가져옴
			User user = userRepository.findByUsername(username); // 사용자 정보가 저장된 데이터에서 사용자 이름으로 사용자 정보를 찾음

			if (user == null) { // 사용자가 존재하지 않으면
				return ResponseEntity
					.status(HttpStatus.NOT_FOUND) // 404 Not Found 응답
					.body(new HashMap<String, String>() {{
						put("message", "User not found");
					}});
			}

			review.setUser(user); // 리뷰에 사용자 정보를 설정

			if (review.getBookId() == null || review.getBookId().isEmpty()) { // bookId가 없으면
				return ResponseEntity
					.status(HttpStatus.BAD_REQUEST) // 400 Bad Request 응답
					.body(new HashMap<String, String>() {{
						put("error", "bookId is required");
						put("status", "400");
					}});
			}

			if (review.getLikes() == null) { // likes가 null이면
				review.setLikes(new ArrayList<>()); // likes를 빈 리스트로 초기화
			}

			Review savedReview = reviewRepository.save(review); // 리뷰를 저장
			return ResponseEntity.status(HttpStatus.CREATED).body(savedReview); // 201 Created 응답과 함께 저장된 리뷰를 반환
		} catch (Exception e) {
			return ResponseEntity
				.status(HttpStatus.INTERNAL_SERVER_ERROR) // 500 Internal Server Error 응답
				.body(new HashMap<String, String>() {{
					put("error", "Internal Server Error: " + e.getMessage());
					put("status", "500");
				}});
		}
	}

	public ResponseEntity<?> updateReview(Long id, Review updatedReview, Jwt jwt) {
		Review existingReview = reviewRepository.findById(id).orElse(null); // 리뷰 ID로 기존 리뷰를 찾음

		if (existingReview == null) { // 리뷰가 존재하지 않으면
			return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Review not found"); // 404 Not Found 응답
		}

		if (jwt == null) { // JWT가 없으면
			return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Unauthorized: Login is required"); // 401 Unauthorized 응답
		}

		String username = jwt.getSubject();

		if (!existingReview.getUser().getUsername().equals(username)) { // 리뷰 작성자와 현재 사용자의 이름이 다르면
			return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Forbidden: You can only update your own reviews"); // 403 Forbidden 응답
		}

		if (updatedReview.getContent() != null) { // 수정된 리뷰 내용이 있으면
			existingReview.setContent(updatedReview.getContent()); // 기존 리뷰 내용 수정
		}

		if (updatedReview.getLikes() != null) { // 수정된 좋아요 목록이 있으면
			existingReview.setLikes(updatedReview.getLikes()); // 기존 리뷰의 좋아요 목록 수정
		}

		existingReview.setId(id); // 리뷰 ID를 기존 ID로 설정
		existingReview.setBookId(existingReview.getBookId()); // bookId는 기존 리뷰의 bookId로 설정

		if (existingReview.getLikes() == null) {
			existingReview.setLikes(new ArrayList<>());
		}

		Review savedReview = reviewRepository.save(existingReview); // 수정된 리뷰를 저장
		return ResponseEntity.ok(savedReview); // 200 OK 응답과 함께 저장된 리뷰를 반환
	}

	public ResponseEntity<?> toggleLike(Long id, List<String> newLikes) {
		Review existingReview = reviewRepository.findById(id).orElse(null);
		
		if (existingReview == null) {
			return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Review not found");
		}

		existingReview.setLikes(newLikes != null ? newLikes : new ArrayList<>()); // 새로운 좋아요 목록이 있으면 설정, 없으면 빈 리스트로 초기화
		Review savedReview = reviewRepository.save(existingReview); // 수정된 리뷰를 저장
		return ResponseEntity.ok(savedReview); // 200 OK 응답과 함께 저장된 리뷰를 반환
	}

	public ResponseEntity<?> deleteReview(Long id, Jwt jwt) {
		if (jwt == null) {
			return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Unauthorized: Login is required");
		}

		Review review = reviewRepository.findById(id).orElse(null);

		if (review == null) {
			return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Review not found");
		}

		String username = jwt.getSubject();
		
		if (!review.getUser().getUsername().equals(username)) {
			return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Forbidden: You can only delete your own reviews");
		}

		reviewRepository.deleteById(id); // 리뷰를 삭제
		return ResponseEntity.noContent().build(); // 204 No Content 응답을 반환하여 삭제 성공을 알림
	}
}