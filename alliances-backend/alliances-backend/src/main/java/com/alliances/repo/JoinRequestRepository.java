package com.alliances.repo;

import com.alliances.domain.JoinRequest;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface JoinRequestRepository extends JpaRepository<JoinRequest, Long> {
    List<JoinRequest> findByPostIdOrderByCreatedAtAsc(Long postId);
    List<JoinRequest> findByPostIdInOrderByCreatedAtAsc(Collection<Long> postIds);
    List<JoinRequest> findByFromUserIdOrderByCreatedAtDesc(Long fromUserId);
    List<JoinRequest> findByFromUserIdAndStatus(Long fromUserId, JoinRequest.Status status);
    Optional<JoinRequest> findByPostIdAndFromUserId(Long postId, Long fromUserId);
    boolean existsByPostIdAndStatus(Long postId, JoinRequest.Status status);
}
