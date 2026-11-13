package com.alliances.service;

import com.alliances.common.ApiException;
import com.alliances.config.JwtService;
import com.alliances.domain.User;
import com.alliances.repo.UserRepository;
import com.alliances.web.Dto;
import com.alliances.web.Dto.*;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuthService {
    private final UserRepository users;
    private final UserService userService;
    private final PasswordEncoder encoder;
    private final JwtService jwt;
    private final GoogleVerifier google;

    public AuthService(UserRepository users, UserService userService, PasswordEncoder encoder, JwtService jwt, GoogleVerifier google) {
        this.users = users; this.userService = userService; this.encoder = encoder; this.jwt = jwt; this.google = google;
    }

    private static String norm(String email) { return email.trim().toLowerCase(); }

    private AuthResponse ok(User u) {
        return new AuthResponse("OK", jwt.generate(u.getId()), Dto.user(u), u.getEmail(), null, null);
    }

    /** 404 ACCOUNT_NOT_FOUND tells the frontend to open the "set up your account" screens. */
    public AuthResponse login(LoginReq r) {
        User u = users.findByEmail(norm(r.email()))
                .orElseThrow(() -> new ApiException(404, "ACCOUNT_NOT_FOUND", "We couldn't find an account for that email."));
        if (u.getPasswordHash() == null) throw new ApiException(400, "USES_GOOGLE", "This account uses Google. Try \"Continue with Google\" instead.");
        if (!encoder.matches(r.password(), u.getPasswordHash())) throw new ApiException(401, "BAD_CREDENTIALS", "That password doesn't match.");
        return ok(u);
    }

    @Transactional
    public AuthResponse register(RegisterReq r) {
        String email = norm(r.email());
        if (users.existsByEmail(email)) throw new ApiException(409, "ACCOUNT_EXISTS", "You already have an account with this email. Log in instead.");
        User u = new User();
        u.setEmail(email);
        u.setPasswordHash(encoder.encode(r.password()));
        u.setProvider(User.Provider.EMAIL);
        return ok(userService.create(u, r.profile()));
    }

    public AuthResponse google(GoogleReq r) {
        GoogleVerifier.Info g = google.verify(r.idToken());
        return users.findByEmail(g.email()).map(this::ok)
                .orElseGet(() -> new AuthResponse("NEW", null, null, g.email(), g.name(), g.picture()));
    }

    @Transactional
    public AuthResponse googleRegister(GoogleRegisterReq r) {
        GoogleVerifier.Info g = google.verify(r.idToken());
        if (users.existsByEmail(g.email())) throw new ApiException(409, "ACCOUNT_EXISTS", "You already have an account. Log in instead.");
        User u = new User();
        u.setEmail(g.email());
        u.setProvider(User.Provider.GOOGLE);
        ProfileReq p = r.profile();
        if ((p.pfp() == null || p.pfp().isBlank()) && !g.picture().isBlank()) {
            p = new ProfileReq(p.name(), p.username(), p.pronouns(), p.bio(), g.picture(), p.college(), p.department(), p.year(),
                    p.section(), p.skills(), p.github(), p.linkedin(), p.leetcode(), p.otherLink());
        }
        return ok(userService.create(u, p));
    }
}
