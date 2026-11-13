package com.alliances.web;

import com.alliances.service.NotificationService;
import com.alliances.web.Dto.NotifView;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/notifications")
public class NotificationController {
    private final NotificationService notes;

    public NotificationController(NotificationService notes) { this.notes = notes; }

    @GetMapping
    public List<NotifView> list(@AuthenticationPrincipal Long uid) { return notes.list(uid); }

    @PostMapping("/read-all")
    public ResponseEntity<Void> readAll(@AuthenticationPrincipal Long uid) { notes.markAllRead(uid); return ResponseEntity.noContent().build(); }

    @PostMapping("/{id}/read")
    public ResponseEntity<Void> read(@AuthenticationPrincipal Long uid, @PathVariable Long id) { notes.markRead(uid, id); return ResponseEntity.noContent().build(); }
}
