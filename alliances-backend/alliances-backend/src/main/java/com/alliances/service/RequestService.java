package com.alliances.service;

import com.alliances.common.ApiException;
import com.alliances.common.Text;
import com.alliances.domain.JoinRequest;
import com.alliances.domain.Post;
import com.alliances.domain.User;
import com.alliances.repo.JoinRequestRepository;
import com.alliances.repo.PostRepository;
import com.alliances.web.Dto;
import com.alliances.web.Dto.ReqView;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;

@Service
public class RequestService {
    public static final List<String> REASONS = List.of("The team is already full", "We need different skills for now",
            "Our plans have changed", "We decided to go in a different direction");

    private final JoinRequestRepository reqs;
    private final PostRepository posts;
    private final UserService users;
    private final NotificationService notes;
    private final TeamRules team;
    private final ChatService chats;

    public RequestService(JoinRequestRepository reqs, PostRepository posts, UserService users, NotificationService notes, TeamRules team, ChatService chats) {
        this.reqs = reqs; this.posts = posts; this.users = users; this.notes = notes; this.team = team; this.chats = chats;
    }

    private ReqView view(JoinRequest r) {
        Post p = posts.findById(r.getPostId()).orElseThrow();
        return new ReqView(r.getId(), p.getId(), p.getTitle(), p.getStatus().name(), p.getDeadline(),
                Dto.user(users.require(r.getFromUserId())), Dto.user(users.require(p.getAuthorId())),
                r.getNote(), r.getStatus().name(), r.getReason(), r.getRejectNote(), r.getSysNote(), r.getCreatedAt());
    }

    private JoinRequest require(Long id) {
        return reqs.findById(id).orElseThrow(() -> new ApiException(404, "NOT_FOUND", "Request not found."));
    }

    /** Loads a request and checks the caller owns the post it belongs to. */
    private JoinRequest asOwner(Long uid, Long id) {
        JoinRequest r = require(id);
        Post p = posts.findById(r.getPostId()).orElseThrow();
        if (!p.getAuthorId().equals(uid)) throw new ApiException(403, "FORBIDDEN", "Only the post owner can do that.");
        return r;
    }

    @Transactional
    public ReqView create(Long uid, Long postId, String note) {
        Post p = posts.findById(postId).orElseThrow(() -> new ApiException(404, "NOT_FOUND", "Post not found."));
        if (p.getAuthorId().equals(uid)) throw new ApiException(400, "OWN_POST", "You can't request your own post.");
        if (p.getStatus() != Post.Status.OPEN) throw new ApiException(409, "NOT_OPEN", "This post is no longer open.");
        if (reqs.findByPostIdAndFromUserId(postId, uid).isPresent()) throw new ApiException(409, "ALREADY_REQUESTED", "You already sent a request for this post.");
        if (team.inTeam(uid, p.getTitle(), null)) throw new ApiException(409, "ALREADY_IN_TEAM", "You're already in a team for " + p.getTitle() + ".");

        JoinRequest r = new JoinRequest();
        r.setPostId(postId);
        r.setFromUserId(uid);
        r.setNote(Text.blankToNull(note));
        reqs.save(r);
        notes.add(p.getAuthorId(), users.require(uid).getName() + " requested to join your " + p.getTitle() + " team.", "requests");
        return view(r);
    }

    @Transactional(readOnly = true)
    public List<ReqView> received(Long uid) {
        List<Long> myPosts = posts.findByAuthorIdOrderByCreatedAtDesc(uid).stream().map(Post::getId).toList();
        if (myPosts.isEmpty()) return List.of();
        return reqs.findByPostIdInOrderByCreatedAtAsc(myPosts).stream().map(this::view).toList();
    }

    @Transactional(readOnly = true)
    public List<ReqView> sent(Long uid) {
        return reqs.findByFromUserIdOrderByCreatedAtDesc(uid).stream().map(this::view).toList();
    }

    @Transactional
    public void withdraw(Long uid, Long id) {
        JoinRequest r = require(id);
        if (!r.getFromUserId().equals(uid)) throw new ApiException(403, "FORBIDDEN", "That isn't your request.");
        if (r.getStatus() != JoinRequest.Status.PENDING) throw new ApiException(409, "NOT_PENDING", "Only pending requests can be withdrawn.");
        reqs.delete(r);
    }

    @Transactional
    public ReqView accept(Long uid, Long id) {
        JoinRequest r = asOwner(uid, id);
        if (r.getStatus() != JoinRequest.Status.PENDING) throw new ApiException(409, "NOT_PENDING", "This request was already answered.");
        Post p = posts.findById(r.getPostId()).orElseThrow();
        User requester = users.require(r.getFromUserId());
        if (team.inTeam(requester.getId(), p.getTitle(), p.getId()))
            throw new ApiException(409, "ALREADY_IN_TEAM", requester.getName() + " is already in a team for this hackathon.");
        r.setStatus(JoinRequest.Status.ACCEPTED);
        r.setDecidedAt(Instant.now());
        reqs.save(r);
        chats.addMember(p, requester.getId());                    // the chat opens only now
        notes.add(requester.getId(), users.require(uid).getName() + " accepted your request for \"" + p.getTitle() + "\". A team chat is open.", "messages");
        return view(r);
    }

    @Transactional
    public ReqView decline(Long uid, Long id, String reason, String note) {
        if (!REASONS.contains(reason)) throw new ApiException(400, "BAD_REASON", "Pick one of the listed reasons.");
        JoinRequest r = asOwner(uid, id);
        if (r.getStatus() != JoinRequest.Status.PENDING) throw new ApiException(409, "NOT_PENDING", "This request was already answered.");
        Post p = posts.findById(r.getPostId()).orElseThrow();
        r.setStatus(JoinRequest.Status.REJECTED);
        r.setReason(reason);
        r.setRejectNote(Text.blankToNull(note));
        r.setDecidedAt(Instant.now());
        reqs.save(r);
        notes.add(r.getFromUserId(), users.require(uid).getName() + " declined your request for \"" + p.getTitle() + "\": " + reason + ".", "requests");
        return view(r);
    }

    /** Owner brings back a declined or expired request. If the post is closed it reopens for 3 more days. */
    @Transactional
    public ReqView revive(Long uid, Long id) {
        JoinRequest r = asOwner(uid, id);
        if (r.getStatus() != JoinRequest.Status.REJECTED && r.getStatus() != JoinRequest.Status.EXPIRED)
            throw new ApiException(409, "NOT_REVIVABLE", "Only declined or expired requests can be revived.");
        Post p = posts.findById(r.getPostId()).orElseThrow();
        r.setStatus(JoinRequest.Status.PENDING);
        r.setSysNote(null); r.setReason(null); r.setRejectNote(null); r.setDecidedAt(null);
        reqs.save(r);
        if (p.getStatus() != Post.Status.OPEN) {
            p.setStatus(Post.Status.OPEN);
            p.setDeadline(LocalDate.now().plusDays(3));
            posts.save(p);
        }
        notes.add(r.getFromUserId(), users.require(uid).getName() + " revived your request for \"" + p.getTitle() + "\".", "requests");
        return view(r);
    }
}
