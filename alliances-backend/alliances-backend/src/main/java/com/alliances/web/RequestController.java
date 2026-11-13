package com.alliances.web;

import com.alliances.service.RequestService;
import com.alliances.web.Dto.*;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/** "My Requests": received = requests on posts I own, sent = requests I made. */
@RestController
@RequestMapping("/api/requests")
public class RequestController {
    private final RequestService requests;

    public RequestController(RequestService requests) { this.requests = requests; }

    @GetMapping("/received") public List<ReqView> received(@AuthenticationPrincipal Long uid) { return requests.received(uid); }
    @GetMapping("/sent")     public List<ReqView> sent(@AuthenticationPrincipal Long uid) { return requests.sent(uid); }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> withdraw(@AuthenticationPrincipal Long uid, @PathVariable Long id) {
        requests.withdraw(uid, id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/accept")  public ReqView accept(@AuthenticationPrincipal Long uid, @PathVariable Long id) { return requests.accept(uid, id); }
    @PostMapping("/{id}/revive")  public ReqView revive(@AuthenticationPrincipal Long uid, @PathVariable Long id) { return requests.revive(uid, id); }

    @PostMapping("/{id}/decline")
    public ReqView decline(@AuthenticationPrincipal Long uid, @PathVariable Long id, @Valid @RequestBody DeclineReq r) {
        return requests.decline(uid, id, r.reason(), r.note());
    }
}
