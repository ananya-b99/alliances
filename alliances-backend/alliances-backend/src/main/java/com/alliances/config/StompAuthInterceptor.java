package com.alliances.config;

import com.alliances.service.ChatService;
import org.springframework.context.annotation.Lazy;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.MessagingException;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Component;

import java.security.Principal;
import java.util.List;

/** CONNECT needs a valid JWT. SUBSCRIBE to /topic/chats/{id} needs chat membership. */
@Component
public class StompAuthInterceptor implements ChannelInterceptor {
    private final JwtService jwt;
    private final ChatService chats;

    public StompAuthInterceptor(JwtService jwt, @Lazy ChatService chats) {
        this.jwt = jwt;
        this.chats = chats;
    }

    @Override
    public Message<?> preSend(Message<?> message, MessageChannel channel) {
        StompHeaderAccessor acc = MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);
        if (acc == null || acc.getCommand() == null) return message;

        if (StompCommand.CONNECT.equals(acc.getCommand())) {
            String h = acc.getFirstNativeHeader("Authorization");
            if (h == null || !h.startsWith("Bearer ")) throw new MessagingException("Log in first.");
            try {
                acc.setUser(new UsernamePasswordAuthenticationToken(jwt.parse(h.substring(7)), null, List.of()));
            } catch (Exception e) {
                throw new MessagingException("Invalid token.");
            }
        } else if (StompCommand.SUBSCRIBE.equals(acc.getCommand())) {
            Principal p = acc.getUser();
            if (!(p instanceof Authentication a) || !(a.getPrincipal() instanceof Long uid)) throw new MessagingException("Log in first.");
            String dest = acc.getDestination();
            if (dest == null || !dest.startsWith("/topic/chats/")) throw new MessagingException("Unknown topic.");
            try {
                if (!chats.isMember(Long.valueOf(dest.substring("/topic/chats/".length())), uid)) throw new MessagingException("Not in this chat.");
            } catch (NumberFormatException e) {
                throw new MessagingException("Bad topic.");
            }
        }
        return message;
    }
}
