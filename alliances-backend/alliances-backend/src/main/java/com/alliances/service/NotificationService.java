package com.alliances.service;

import com.alliances.common.ApiException;
import com.alliances.domain.Notification;
import com.alliances.repo.NotificationRepository;
import com.alliances.web.Dto.NotifView;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class NotificationService {
    private final NotificationRepository repo;

    public NotificationService(NotificationRepository repo) { this.repo = repo; }

    /** Called by the other services whenever something happens that a user should hear about. */
    public void add(Long userId, String text, String target) {
        Notification n = new Notification();
        n.setUserId(userId);
        n.setText(text);
        n.setTarget(target);
        repo.save(n);
    }

    @Transactional(readOnly = true)
    public List<NotifView> list(Long uid) {
        return repo.findTop50ByUserIdOrderByCreatedAtDesc(uid).stream()
                .map(n -> new NotifView(n.getId(), n.getText(), n.getTarget(), n.isSeen(), n.getCreatedAt())).toList();
    }

    @Transactional
    public void markAllRead(Long uid) {
        List<Notification> unread = repo.findByUserIdAndSeenFalse(uid);
        unread.forEach(n -> n.setSeen(true));
        repo.saveAll(unread);
    }

    @Transactional
    public void markRead(Long uid, Long id) {
        Notification n = repo.findById(id).filter(x -> x.getUserId().equals(uid))
                .orElseThrow(() -> new ApiException(404, "NOT_FOUND", "Notification not found."));
        n.setSeen(true);
        repo.save(n);
    }
}
