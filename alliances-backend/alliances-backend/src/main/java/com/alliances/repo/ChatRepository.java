package com.alliances.repo;

import com.alliances.domain.Chat;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;
import java.util.Optional;

public interface ChatRepository extends JpaRepository<Chat, Long> {
    Optional<Chat> findByPostId(Long postId);

    @Query("select distinct c from Chat c join c.memberIds m where m = :userId order by c.id desc")
    List<Chat> findForMember(@Param("userId") Long userId);
}
