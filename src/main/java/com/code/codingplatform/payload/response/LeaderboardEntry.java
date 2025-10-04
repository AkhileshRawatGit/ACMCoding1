package com.code.codingplatform.payload.response;

public class LeaderboardEntry {
    private Long userId;
    private String username;
    private String email;
    private Integer grandTotalScore;
    private Integer rank;

    public LeaderboardEntry() {
    }

    public LeaderboardEntry(Long userId, String username, String email, Integer grandTotalScore, Integer rank) {
        this.userId = userId;
        this.username = username;
        this.email = email;
        this.grandTotalScore = grandTotalScore;
        this.rank = rank;
    }

    public Long getUserId() {
        return userId;
    }

    public void setUserId(Long userId) {
        this.userId = userId;
    }

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public Integer getGrandTotalScore() {
        return grandTotalScore;
    }

    public void setGrandTotalScore(Integer grandTotalScore) {
        this.grandTotalScore = grandTotalScore;
    }

    public Integer getRank() {
        return rank;
    }

    public void setRank(Integer rank) {
        this.rank = rank;
    }
}
