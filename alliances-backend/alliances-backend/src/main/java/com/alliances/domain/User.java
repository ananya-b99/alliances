package com.alliances.domain;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;
import java.util.LinkedHashSet;
import java.util.Set;

@Entity
@Table(name = "users")
@Getter @Setter @NoArgsConstructor
public class User {
    public enum Provider { EMAIL, GOOGLE }

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(nullable = false, unique = true)
    private String email;
    private String passwordHash;                       // null for Google accounts
    @Enumerated(EnumType.STRING) @Column(nullable = false)
    private Provider provider;

    @Column(nullable = false) private String name;
    @Column(nullable = false, unique = true, length = 20) private String username;
    @Column(length = 40) private String pronouns;
    @Column(length = 160) private String bio;
    @Column(length = 200000) private String pfp;       // data URL for now, Cloudinary URL later
    private String college;
    private String department;
    @Column(name = "study_year") private String studyYear;
    private String section;
    @Column(length = 300) private String github;
    @Column(length = 300) private String linkedin;
    @Column(length = 300) private String leetcode;
    @Column(length = 300) private String otherLink;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "user_skills", joinColumns = @JoinColumn(name = "user_id"))
    @Column(name = "skill", length = 30)
    private Set<String> skills = new LinkedHashSet<>();

    private Instant createdAt;
    @PrePersist void onCreate() { createdAt = Instant.now(); }
}
