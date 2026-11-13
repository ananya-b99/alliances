package com.alliances.domain;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;

@Entity
@Table(name = "notifications")
@Getter @Setter @NoArgsConstructor
public class Notification {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(nullable = false) private Long userId;
    @Column(nullable = false, length = 400) private String text;
    private String target;          // frontend view to open: requests, messages ...
    private boolean seen;
    private Instant createdAt;
    @PrePersist void onCreate() { createdAt = Instant.now(); }
}
