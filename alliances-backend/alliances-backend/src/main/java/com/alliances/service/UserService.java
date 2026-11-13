package com.alliances.service;

import com.alliances.common.ApiException;
import com.alliances.common.Text;
import com.alliances.domain.User;
import com.alliances.repo.UserRepository;
import com.alliances.web.Dto;
import com.alliances.web.Dto.ProfileReq;
import com.alliances.web.Dto.UserView;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.LinkedHashSet;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class UserService {
    private final UserRepository users;

    public UserService(UserRepository users) { this.users = users; }

    public User require(Long id) {
        return users.findById(id).orElseThrow(() -> new ApiException(404, "NOT_FOUND", "User not found."));
    }

    public boolean usernameFree(String username) { return !users.existsByUsername(username.toLowerCase().trim()); }

    /** First save of a brand new account (email or Google). */
    @Transactional
    public User create(User u, ProfileReq p) {
        if (users.existsByUsername(p.username())) throw new ApiException(409, "USERNAME_TAKEN", "That username is taken. Try another.");
        apply(u, p);
        return users.save(u);
    }

    @Transactional
    public UserView updateMe(Long id, ProfileReq p) {
        User u = require(id);
        users.findByUsername(p.username()).filter(x -> !x.getId().equals(id))
                .ifPresent(x -> { throw new ApiException(409, "USERNAME_TAKEN", "That username is taken. Try another."); });
        apply(u, p);
        return Dto.user(users.save(u));
    }

    private void apply(User u, ProfileReq p) {
        u.setName(p.name().trim());
        u.setUsername(p.username().trim().toLowerCase());
        u.setPronouns(Text.blankToNull(p.pronouns()));
        u.setBio(Text.blankToNull(p.bio()));
        u.setPfp(Text.blankToNull(p.pfp()));
        u.setCollege(p.college().trim());
        u.setDepartment(p.department().trim());
        u.setStudyYear(p.year().trim());
        u.setSection(Text.blankToNull(p.section()));
        u.setGithub(Text.link(p.github()));
        u.setLinkedin(Text.link(p.linkedin()));
        u.setLeetcode(Text.link(p.leetcode()));
        u.setOtherLink(Text.link(p.otherLink()));
        Set<String> skills = p.skills().stream().map(String::trim).filter(s -> !s.isEmpty())
                .map(s -> s.length() > 30 ? s.substring(0, 30) : s).collect(Collectors.toCollection(LinkedHashSet::new));
        if (skills.isEmpty()) throw new ApiException(400, "NO_SKILLS", "Pick at least one skill.");
        u.getSkills().clear();
        u.getSkills().addAll(skills);
    }
}
