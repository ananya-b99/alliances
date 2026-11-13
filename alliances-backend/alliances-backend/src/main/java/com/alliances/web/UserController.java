package com.alliances.web;

import com.alliances.domain.User;
import com.alliances.service.UserService;
import com.alliances.web.Dto.*;
import jakarta.validation.Valid;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/users")
public class UserController {
    private final UserService users;

    public UserController(UserService users) { this.users = users; }

    @GetMapping("/me")
    public MeView me(@AuthenticationPrincipal Long uid) {
        User u = users.require(uid);
        return new MeView(u.getEmail(), u.getProvider().name(), Dto.user(u));
    }

    @PutMapping("/me")
    public UserView update(@AuthenticationPrincipal Long uid, @Valid @RequestBody ProfileReq r) { return users.updateMe(uid, r); }

    @GetMapping("/{id}")
    public UserView get(@PathVariable Long id) { return Dto.user(users.require(id)); }

    @GetMapping("/username-available")
    public Map<String, Boolean> available(@RequestParam String username) { return Map.of("available", users.usernameFree(username)); }
}
