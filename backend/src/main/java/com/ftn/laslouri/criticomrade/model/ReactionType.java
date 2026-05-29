package com.ftn.laslouri.criticomrade.model;

public enum ReactionType {
    LIKE("👍"),
    DISLIKE("👎"),
    FUNNY("😂"),
    HEART_EYES("😍"),
    SURPRISED("😮"),
    CRYING("😢"),
    ANGRY("😡"),
    ROCK_ON("🤘"),
    THANKFUL("🙏"),
    STRONG("💪"),
    FEEL_GOOD("🌟"),
    THOUGHT_PROVOKING("🤔");

    private final String emoji;

    ReactionType(String emoji) {
        this.emoji = emoji;
    }

    public String getEmoji() {
        return emoji;
    }
}
