package com.alliances.web;

import com.alliances.service.AuthService;
import com.alliances.web.Dto.*;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

/**
 * Public endpoints.
 *  login: 404 ACCOUNT_NOT_FOUND means "open the set-up-your-account screens", then call register with the same email + password.
 *  google: returns status NEW when the Google user has no account yet, then call google/register with the details.
 */
@RestController
@RequestMapping("/api/auth")
public class AuthController {
    private final AuthService auth;

    public AuthController(AuthService auth) { this.auth = auth; }

    @PostMapping("/login")           public AuthResponse login(@Valid @RequestBody LoginReq r) { return auth.login(r); }
    @PostMapping("/register")        public AuthResponse register(@Valid @RequestBody RegisterReq r) { return auth.register(r); }
    @PostMapping("/google")          public AuthResponse google(@Valid @RequestBody GoogleReq r) { return auth.google(r); }
    @PostMapping("/google/register") public AuthResponse googleRegister(@Valid @RequestBody GoogleRegisterReq r) { return auth.googleRegister(r); }
}
