package com.alliances.domain;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;

@Entity
@Table(name = "messages")
@Getter @Setter @NoArgsConstructor
public class ChatMessage {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(nullable = false) private Long chatId;
    private Long senderId;                      // null for system messages
    @Column(name = "is_system") private boolean system;
    @Column(nullable = false, length = 1000) private String body;
    private Instant createdAt;
    @PrePersist void onCreate() { createdAt = Instant.now(); }
}
