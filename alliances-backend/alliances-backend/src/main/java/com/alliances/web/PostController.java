package com.alliances.web;

import com.alliances.service.PostService;
import com.alliances.service.RequestService;
import com.alliances.web.Dto.*;
import jakarta.validation.Valid;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Set;

@RestController
@RequestMapping("/api/posts")
public class PostController {
    private final PostService posts;
    private final RequestService requests;

    public PostController(PostService posts, RequestService requests) { this.posts = posts; this.requests = requests; }

    /** Feed. idea = any | has | none.  skills = comma separated.  includeClosed shows closed and expired posts too. */
    @GetMapping
    public List<PostView> list(@AuthenticationPrincipal Long uid, @RequestParam(defaultValue = "hackathon") String tab,
                               @RequestParam(required = false) String idea, @RequestParam(required = false) Set<String> skills,
                               @RequestParam(defaultValue = "false") boolean includeClosed) {
        return posts.list(uid, tab, idea, skills, includeClosed);
    }

    @PostMapping
    public PostView create(@AuthenticationPrincipal Long uid, @Valid @RequestBody CreatePostReq r) { return posts.create(uid, r); }

    @GetMapping("/mine")
    public List<PostView> mine(@AuthenticationPrincipal Long uid) { return posts.mine(uid); }

    @GetMapping("/{id}")
    public PostView get(@AuthenticationPrincipal Long uid, @PathVariable Long id) { return posts.get(uid, id); }

    @PostMapping("/{id}/close")
    public PostView close(@AuthenticationPrincipal Long uid, @PathVariable Long id) { return posts.close(uid, id); }

    @PostMapping("/{id}/requests")
    public ReqView request(@AuthenticationPrincipal Long uid, @PathVariable Long id, @Valid @RequestBody(required = false) CreateRequestReq r) {
        return requests.create(uid, id, r == null ? null : r.note());
    }
}
