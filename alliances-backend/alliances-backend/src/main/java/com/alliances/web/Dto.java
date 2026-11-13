package com.alliances.web;

import com.alliances.domain.User;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;

import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/** Every request and response shape in one place. These match what the frontend already uses. */
public final class Dto {
    private Dto() {}

    // ---------- users ----------
    public record UserView(Long id, String name, String username, String pronouns, String bio, String pfp,
                           String college, String department, String year, String section,
                           List<String> skills, Map<String, String> links) {}

    public record MeView(String email, String provider, UserView user) {}

    public record ProfileReq(
            @NotBlank @Size(min = 2, max = 80) String name,
            @NotBlank @Pattern(regexp = "^[a-z0-9_]{3,20}$", message = "Username must be 3 to 20 lowercase letters, numbers or underscores.") String username,
            @Size(max = 40) String pronouns,
            @Size(max = 160) String bio,
            @Size(max = 200000) String pfp,
            @NotBlank @Size(max = 120) String college,
            @NotBlank @Size(max = 60) String department,
            @NotBlank @Size(max = 30) String year,
            @Size(max = 20) String section,
            @NotEmpty(message = "Pick at least one skill.") @Size(max = 30) List<String> skills,
            @Size(max = 300) String github, @Size(max = 300) String linkedin,
            @Size(max = 300) String leetcode, @Size(max = 300) String otherLink) {}

    public static UserView user(User u) {
        Map<String, String> links = new LinkedHashMap<>();
        if (u.getGithub() != null) links.put("github", u.getGithub());
        if (u.getLinkedin() != null) links.put("linkedin", u.getLinkedin());
        if (u.getLeetcode() != null) links.put("leetcode", u.getLeetcode());
        if (u.getOtherLink() != null) links.put("other", u.getOtherLink());
        return new UserView(u.getId(), u.getName(), u.getUsername(), u.getPronouns(), u.getBio(), u.getPfp(),
                u.getCollege(), u.getDepartment(), u.getStudyYear(), u.getSection(), new ArrayList<>(u.getSkills()), links);
    }

    // ---------- auth ----------
    public record LoginReq(@NotBlank @Email String email, @NotBlank String password) {}
    public record RegisterReq(@NotBlank @Email String email, @NotBlank @Size(min = 8, max = 72, message = "Use at least 8 characters.") String password,
                              @Valid @NotNull ProfileReq profile) {}
    public record GoogleReq(@NotBlank String idToken) {}
    public record GoogleRegisterReq(@NotBlank String idToken, @Valid @NotNull ProfileReq profile) {}
    /** status OK: token + user are set.  status NEW (Google, no account yet): email/name/picture are set. */
    public record AuthResponse(String status, String token, UserView user, String email, String name, String picture) {}

    // ---------- posts ----------
    public record CreatePostReq(
            @NotBlank @Size(max = 80) String title, @Size(max = 300) String link, boolean hasIdea,
            @Size(max = 140) String ideaText, @Min(1) @Max(10) int teamSize,
            @NotEmpty(message = "Pick at least one skill you need.") List<String> skills,
            @Size(max = 300) String description, @NotNull LocalDate deadline) {}

    public record PostView(Long id, String tab, String title, String link, boolean hasIdea, String ideaText, int teamSize,
                           List<String> skills, String description, LocalDate deadline, String status, Instant createdAt,
                           UserView author, boolean mine, Long myRequestId, String myRequestStatus) {}

    // ---------- requests ----------
    public record CreateRequestReq(@Size(max = 300) String note) {}
    public record DeclineReq(@NotBlank String reason, @Size(max = 200) String note) {}
    public record ReqView(Long id, Long postId, String postTitle, String postStatus, LocalDate postDeadline,
                          UserView from, UserView owner, String note, String status, String reason, String rejectNote,
                          String sysNote, Instant createdAt) {}

    // ---------- notifications + chat ----------
    public record NotifView(Long id, String text, String target, boolean seen, Instant createdAt) {}
    public record ChatView(Long id, Long postId, String name, boolean closed, Long ownerId, List<UserView> members) {}
    public record MsgView(Long id, Long chatId, Long senderId, String senderName, boolean system, String body, Instant createdAt) {}
    public record SendMsgReq(@NotBlank @Size(max = 1000) String body) {}

    public record ErrorBody(String code, String message) {}
}
