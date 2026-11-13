package com.alliances.service;

import com.alliances.common.ApiException;
import com.alliances.domain.Chat;
import com.alliances.domain.ChatMessage;
import com.alliances.domain.Post;
import com.alliances.repo.ChatMessageRepository;
import com.alliances.repo.ChatRepository;
import com.alliances.web.Dto;
import com.alliances.web.Dto.ChatView;
import com.alliances.web.Dto.MsgView;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/** One group chat per post. It opens when the first request is accepted. Members can leave, the owner can close it for everyone. */
@Service
public class ChatService {
    private final ChatRepository chats;
    private final ChatMessageRepository msgs;
    private final UserService users;
    private final SimpMessagingTemplate ws;

    public ChatService(ChatRepository chats, ChatMessageRepository msgs, UserService users, SimpMessagingTemplate ws) {
        this.chats = chats; this.msgs = msgs; this.users = users; this.ws = ws;
    }

    public boolean isMember(Long chatId, Long uid) {
        return chats.findById(chatId).map(c -> c.getMemberIds().contains(uid)).orElse(false);
    }

    private Chat member(Long uid, Long chatId) {
        Chat c = chats.findById(chatId).orElseThrow(() -> new ApiException(404, "NOT_FOUND", "Chat not found."));
        if (!c.getMemberIds().contains(uid)) throw new ApiException(403, "NOT_A_MEMBER", "You're not in this chat.");
        return c;
    }

    private MsgView view(ChatMessage m) {
        return new MsgView(m.getId(), m.getChatId(), m.getSenderId(), m.getSenderId() == null ? null : users.require(m.getSenderId()).getName(),
                m.isSystem(), m.getBody(), m.getCreatedAt());
    }

    private MsgView push(ChatMessage m) {
        MsgView v = view(msgs.save(m));
        ws.convertAndSend("/topic/chats/" + v.chatId(), v);        // everyone subscribed to this chat sees it live
        return v;
    }

    private void system(Chat c, String text) {
        ChatMessage m = new ChatMessage();
        m.setChatId(c.getId());
        m.setSystem(true);
        m.setBody(text);
        push(m);
    }

    /** Called when a request is accepted: creates the post's chat on first accept, then adds the new member. */
    @Transactional
    public void addMember(Post p, Long userId) {
        Chat c = chats.findByPostId(p.getId()).orElseGet(() -> {
            Chat n = new Chat();
            n.setPostId(p.getId());
            n.setName(p.getTitle() + " team");
            n.setOwnerId(p.getAuthorId());
            n.getMemberIds().add(p.getAuthorId());
            return chats.save(n);
        });
        c.setClosed(false);
        c.getMemberIds().add(userId);
        chats.save(c);
        system(c, users.require(userId).getName() + " joined the team chat.");
    }

    @Transactional(readOnly = true)
    public List<ChatView> list(Long uid) {
        return chats.findForMember(uid).stream().map(c -> new ChatView(c.getId(), c.getPostId(), c.getName(), c.isClosed(), c.getOwnerId(),
                c.getMemberIds().stream().map(id -> Dto.user(users.require(id))).toList())).toList();
    }

    @Transactional(readOnly = true)
    public ChatView byPost(Long uid, Long postId) {
        Chat c = chats.findByPostId(postId).orElseThrow(() -> new ApiException(404, "NOT_FOUND", "No chat for this post yet."));
        member(uid, c.getId());
        return new ChatView(c.getId(), c.getPostId(), c.getName(), c.isClosed(), c.getOwnerId(),
                c.getMemberIds().stream().map(id -> Dto.user(users.require(id))).toList());
    }

    @Transactional(readOnly = true)
    public List<MsgView> messages(Long uid, Long chatId) {
        member(uid, chatId);
        return msgs.findByChatIdOrderByCreatedAtAsc(chatId).stream().map(this::view).toList();
    }

    @Transactional
    public MsgView send(Long uid, Long chatId, String body) {
        Chat c = member(uid, chatId);
        if (c.isClosed()) throw new ApiException(409, "CHAT_CLOSED", "This chat is closed.");
        ChatMessage m = new ChatMessage();
        m.setChatId(chatId);
        m.setSenderId(uid);
        m.setBody(body.trim());
        return push(m);
    }

    @Transactional
    public void leave(Long uid, Long chatId) {
        Chat c = member(uid, chatId);
        c.getMemberIds().remove(uid);
        if (c.getMemberIds().size() < 2) c.setClosed(true);
        chats.save(c);
        system(c, users.require(uid).getName() + " left the chat.");
    }

    @Transactional
    public void close(Long uid, Long chatId) {
        Chat c = member(uid, chatId);
        if (!c.getOwnerId().equals(uid)) throw new ApiException(403, "FORBIDDEN", "Only the team owner can close the chat for everyone.");
        c.setClosed(true);
        chats.save(c);
        system(c, users.require(uid).getName() + " closed the chat.");
    }
}
