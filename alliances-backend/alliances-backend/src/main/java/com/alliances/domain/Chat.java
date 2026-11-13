package com.alliances.domain;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;
import java.util.LinkedHashSet;
import java.util.Set;

/** One group chat per post. It only exists once a request has been accepted. */
@Entity
@Table(name = "chats")
@Getter @Setter @NoArgsConstructor
public class Chat {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(nullable = false) private Long postId;
    @Column(nullable = false) private String name;
    @Column(nullable = false) private Long ownerId;
    private boolean closed;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "chat_members", joinColumns = @JoinColumn(name = "chat_id"))
    @Column(name = "user_id")
    private Set<Long> memberIds = new LinkedHashSet<>();

    private Instant createdAt;
    @PrePersist void onCreate() { createdAt = Instant.now(); }
}
