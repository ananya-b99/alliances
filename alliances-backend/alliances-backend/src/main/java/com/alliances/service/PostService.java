package com.alliances.service;

import com.alliances.common.ApiException;
import com.alliances.common.Text;
import com.alliances.domain.JoinRequest;
import com.alliances.domain.Post;
import com.alliances.repo.JoinRequestRepository;
import com.alliances.repo.PostRepository;
import com.alliances.web.Dto;
import com.alliances.web.Dto.CreatePostReq;
import com.alliances.web.Dto.PostView;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.Comparator;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class PostService {
    private final PostRepository posts;
    private final JoinRequestRepository reqs;
    private final UserService users;
    private final NotificationService notes;
    private final TeamRules team;

    public PostService(PostRepository posts, JoinRequestRepository reqs, UserService users, NotificationService notes, TeamRules team) {
        this.posts = posts; this.reqs = reqs; this.users = users; this.notes = notes; this.team = team;
    }

    public static Post.Tab tab(String s) {
        try { return Post.Tab.valueOf(s.trim().toUpperCase()); }
        catch (Exception e) { throw new ApiException(400, "BAD_TAB", "Unknown tab."); }
    }

    PostView view(Post p, Long uid) {
        JoinRequest mine = reqs.findByPostIdAndFromUserId(p.getId(), uid).orElse(null);
        return new PostView(p.getId(), p.getTab().name(), p.getTitle(), p.getLink(), p.isHasIdea(), p.getIdeaText(), p.getTeamSize(),
                List.copyOf(p.getSkills()), p.getDescription(), p.getDeadline(), p.getStatus().name(), p.getCreatedAt(),
                Dto.user(users.require(p.getAuthorId())), p.getAuthorId().equals(uid),
                mine == null ? null : mine.getId(), mine == null ? null : mine.getStatus().name());
    }

    @Transactional(readOnly = true)
    public List<PostView> list(Long uid, String tabName, String idea, Set<String> skills, boolean includeClosed) {
        Post.Tab tab = tab(tabName);
        if (tab != Post.Tab.HACKATHON) return List.of();            // other tabs ship later
        return posts.findByTabOrderByCreatedAtDesc(tab).stream()
                .filter(p -> includeClosed || p.getStatus() == Post.Status.OPEN)
                .filter(p -> idea == null || idea.equals("any") || p.isHasIdea() == idea.equals("has"))
                .filter(p -> skills == null || skills.isEmpty() || p.getSkills().stream().anyMatch(s -> skills.stream().anyMatch(x -> x.equalsIgnoreCase(s))))
                .sorted(Comparator.comparing((Post p) -> p.getStatus() == Post.Status.OPEN ? 0 : 1))   // open first, newest first inside
                .map(p -> view(p, uid)).toList();
    }

    @Transactional(readOnly = true)
    public List<PostView> mine(Long uid) {
        return posts.findByAuthorIdOrderByCreatedAtDesc(uid).stream().map(p -> view(p, uid)).toList();
    }

    @Transactional(readOnly = true)
    public PostView get(Long uid, Long id) { return view(require(id), uid); }

    Post require(Long id) {
        return posts.findById(id).orElseThrow(() -> new ApiException(404, "NOT_FOUND", "Post not found."));
    }

    @Transactional
    public PostView create(Long uid, CreatePostReq r) {
        if (r.deadline().isBefore(LocalDate.now())) throw new ApiException(400, "BAD_DEADLINE", "The deadline can't be in the past.");
        Set<String> skills = r.skills().stream().map(String::trim).filter(s -> !s.isEmpty())
                .map(s -> s.length() > 30 ? s.substring(0, 30) : s).collect(Collectors.toCollection(LinkedHashSet::new));
        if (skills.isEmpty()) throw new ApiException(400, "NO_SKILLS", "Pick at least one skill you need.");
        String title = r.title().trim();
        if (team.inTeam(uid, title, null)) throw new ApiException(409, "ALREADY_IN_TEAM", "You're already in a team for " + title + ".");

        Post p = new Post();
        p.setTab(Post.Tab.HACKATHON);
        p.setAuthorId(uid);
        p.setTitle(title);
        p.setLink(Text.link(r.link()));
        p.setHasIdea(r.hasIdea());
        p.setIdeaText(r.hasIdea() ? Text.blankToNull(r.ideaText()) : null);
        p.setTeamSize(r.teamSize());
        p.setDescription(Text.blankToNull(r.description()));
        p.setDeadline(r.deadline());
        p.setSkills(skills);
        return view(posts.save(p), uid);
    }

    @Transactional
    public PostView close(Long uid, Long id) {
        Post p = require(id);
        if (!p.getAuthorId().equals(uid)) throw new ApiException(403, "FORBIDDEN", "Only the owner can close this post.");
        if (p.getStatus() != Post.Status.OPEN) throw new ApiException(409, "NOT_OPEN", "This post is already closed.");
        endPost(p, Post.Status.CLOSED);
        return view(p, uid);
    }

    /** Used for both "owner closed it" and "deadline passed": pending requests expire and everyone is told, so nobody is ghosted. */
    @Transactional
    public void endPost(Post p, Post.Status why) {
        p.setStatus(why);
        posts.save(p);
        String reason = why == Post.Status.EXPIRED ? "The post passed its deadline." : "The owner closed the post.";
        for (JoinRequest r : reqs.findByPostIdOrderByCreatedAtAsc(p.getId())) {
            if (r.getStatus() != JoinRequest.Status.PENDING) continue;
            r.setStatus(JoinRequest.Status.EXPIRED);
            r.setSysNote(reason);
            reqs.save(r);
            notes.add(r.getFromUserId(), "Your request for \"" + p.getTitle() + "\" expired. " + reason, "requests");
        }
        if (why == Post.Status.EXPIRED) notes.add(p.getAuthorId(), "Your post \"" + p.getTitle() + "\" passed its deadline.", "requests");
    }

    /** Runs every minute (and once at startup). Deadline day counts until midnight, like the frontend. */
    @Scheduled(fixedDelay = 60_000)
    @Transactional
    public void sweepExpired() {
        posts.findByStatusAndDeadlineBefore(Post.Status.OPEN, LocalDate.now()).forEach(p -> endPost(p, Post.Status.EXPIRED));
    }
}
