package com.bookreview.server.review;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ReviewRepository extends JpaRepository<Review, Long> {
  List<Review> findByBookId(String bookId); // bookId로 리뷰를 찾음
}
