package com.alliances.service;

import com.alliances.common.ApiException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import java.util.Map;

/**
 * Checks a Google ID token (the "credential" the Google button gives the frontend).
 * Uses Google's tokeninfo endpoint, which is fine for a college project. For production, switch to
 * Google's verifier library so tokens are checked locally.
 */
@Component
public class GoogleVerifier {
    public record Info(String email, String name, String picture) {}

    private final RestClient http = RestClient.create();
    @Value("${app.google.client-id:}") private String clientId;

    public Info verify(String idToken) {
        if (clientId.isBlank()) throw new ApiException(503, "GOOGLE_NOT_CONFIGURED", "Google sign-in is not set up on the server yet.");
        Map<String, Object> m;
        try {
            m = http.get().uri("https://oauth2.googleapis.com/tokeninfo?id_token={t}", idToken)
                    .retrieve().body(new ParameterizedTypeReference<Map<String, Object>>() {});
        } catch (Exception e) {
            throw new ApiException(401, "BAD_GOOGLE_TOKEN", "Google sign-in failed. Please try again.");
        }
        if (m == null || !clientId.equals(str(m.get("aud"))) || !"true".equals(str(m.get("email_verified")))) {
            throw new ApiException(401, "BAD_GOOGLE_TOKEN", "Google sign-in failed. Please try again.");
        }
        return new Info(str(m.get("email")).toLowerCase(), str(m.get("name")), str(m.get("picture")));
    }

    private static String str(Object o) { return o == null ? "" : String.valueOf(o); }
}
