package com.alliances.common;

import java.net.URI;

public final class Text {
    private Text() {}

    /** Same rule as the frontend: add https:// if missing, reject anything that is not a real-looking link. */
    public static String link(String v) {
        if (v == null || v.isBlank()) return null;
        v = v.trim();
        if (!v.matches("(?i)^https?://.*")) v = "https://" + v;
        try {
            String host = new URI(v).getHost();
            if (host == null || !host.contains(".")) throw new IllegalArgumentException();
        } catch (Exception e) {
            throw new ApiException(400, "BAD_LINK", "One of those links doesn't look right.");
        }
        return v;
    }

    /** Hackathon name normalised, so "Smart India Hackathon" and "smart-india hackathon" count as the same one. */
    public static String key(String title) {
        return title == null ? "" : title.toLowerCase().replaceAll("[^a-z0-9]", "");
    }

    public static String blankToNull(String s) {
        return s == null || s.isBlank() ? null : s.trim();
    }
}
