package com.alliances.web;

import com.alliances.service.ChatService;
import com.alliances.web.Dto.*;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/** Sending is a normal POST. Live delivery: subscribe to /topic/chats/{id} over the /ws socket. */
@RestController
@RequestMapping("/api/chats")
public class ChatController {
    private final ChatService chats;

    public ChatController(ChatService chats) { this.chats = chats; }

    @GetMapping
    public List<ChatView> list(@AuthenticationPrincipal Long uid) { return chats.list(uid); }

    @GetMapping("/by-post/{postId}")
    public ChatView byPost(@AuthenticationPrincipal Long uid, @PathVariable Long postId) { return chats.byPost(uid, postId); }

    @GetMapping("/{id}/messages")
    public List<MsgView> messages(@AuthenticationPrincipal Long uid, @PathVariable Long id) { return chats.messages(uid, id); }

    @PostMapping("/{id}/messages")
    public MsgView send(@AuthenticationPrincipal Long uid, @PathVariable Long id, @Valid @RequestBody SendMsgReq r) { return chats.send(uid, id, r.body()); }

    @PostMapping("/{id}/leave")
    public ResponseEntity<Void> leave(@AuthenticationPrincipal Long uid, @PathVariable Long id) { chats.leave(uid, id); return ResponseEntity.noContent().build(); }

    @PostMapping("/{id}/close")
    public ResponseEntity<Void> close(@AuthenticationPrincipal Long uid, @PathVariable Long id) { chats.close(uid, id); return ResponseEntity.noContent().build(); }
}
