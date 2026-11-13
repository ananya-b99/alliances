package com.alliances.domain;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;
import java.time.LocalDate;
import java.util.LinkedHashSet;
import java.util.Set;

@Entity
@Table(name = "posts")
@Getter @Setter @NoArgsConstructor
public class Post {
    public enum Tab { HACKATHON, RESEARCH, PROJECT, MENTOR, IDEAS, SURVEYS, SHOWCASE }
    public enum Status { OPEN, CLOSED, EXPIRED }

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Enumerated(EnumType.STRING) @Column(nullable = false)
    private Tab tab;
    @Column(nullable = false) private Long authorId;
    @Column(nullable = false, length = 80) private String title;     // hackathon name
    @Column(length = 300) private String link;
    private boolean hasIdea;
    @Column(length = 140) private String ideaText;
    private int teamSize;                                              // people still needed
    @Column(length = 300) private String description;
    @Column(nullable = false) private LocalDate deadline;              // requests close at the end of this day
    @Enumerated(EnumType.STRING) @Column(nullable = false)
    private Status status = Status.OPEN;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "post_skills", joinColumns = @JoinColumn(name = "post_id"))
    @Column(name = "skill", length = 30)
    private Set<String> skills = new LinkedHashSet<>();

    private Instant createdAt;
    @PrePersist void onCreate() { createdAt = Instant.now(); }
}
