package com.alliances.service;

import com.alliances.common.Text;
import com.alliances.domain.JoinRequest;
import com.alliances.domain.Post;
import com.alliances.repo.JoinRequestRepository;
import com.alliances.repo.PostRepository;
import org.springframework.stereotype.Component;

/** Rule: a user can never be in more than one team for the same hackathon. */
@Component
public class TeamRules {
    private final PostRepository posts;
    private final JoinRequestRepository reqs;

    public TeamRules(PostRepository posts, JoinRequestRepository reqs) { this.posts = posts; this.reqs = reqs; }

    public boolean inTeam(Long userId, String hackathon, Long exceptPostId) {
        String k = Text.key(hackathon);
        boolean joined = reqs.findByFromUserIdAndStatus(userId, JoinRequest.Status.ACCEPTED).stream()
                .map(r -> posts.findById(r.getPostId()).orElse(null))
                .anyMatch(p -> p != null && !p.getId().equals(exceptPostId) && Text.key(p.getTitle()).equals(k));
        if (joined) return true;
        // or they own a post for the same hackathon that already has an accepted member
        return posts.findByAuthorIdOrderByCreatedAtDesc(userId).stream()
                .anyMatch(p -> !p.getId().equals(exceptPostId) && Text.key(p.getTitle()).equals(k)
                        && reqs.existsByPostIdAndStatus(p.getId(), JoinRequest.Status.ACCEPTED));
    }
}
