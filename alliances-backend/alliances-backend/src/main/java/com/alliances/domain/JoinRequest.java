package com.alliances.domain;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;

@Entity
@Table(name = "join_requests", uniqueConstraints = @UniqueConstraint(columnNames = {"post_id", "from_user_id"}))
@Getter @Setter @NoArgsConstructor
public class JoinRequest {
    public enum Status { PENDING, ACCEPTED, REJECTED, EXPIRED }

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(nullable = false) private Long postId;
    @Column(nullable = false) private Long fromUserId;
    @Column(length = 300) private String note;                 // optional note from the requester
    @Enumerated(EnumType.STRING) @Column(nullable = false)
    private Status status = Status.PENDING;
    private String reason;                                      // preset decline reason
    @Column(length = 200) private String rejectNote;            // optional custom decline note
    private String sysNote;                                     // "The post passed its deadline." etc.
    private Instant createdAt;
    private Instant decidedAt;
    @PrePersist void onCreate() { createdAt = Instant.now(); }
}
