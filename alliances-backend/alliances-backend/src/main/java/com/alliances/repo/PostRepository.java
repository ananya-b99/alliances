package com.alliances.repo;

import com.alliances.domain.Post;
import org.springframework.data.jpa.repository.JpaRepository;
import java.time.LocalDate;
import java.util.List;

public interface PostRepository extends JpaRepository<Post, Long> {
    List<Post> findByTabOrderByCreatedAtDesc(Post.Tab tab);
    List<Post> findByAuthorIdOrderByCreatedAtDesc(Long authorId);
    List<Post> findByStatusAndDeadlineBefore(Post.Status status, LocalDate date);
}
