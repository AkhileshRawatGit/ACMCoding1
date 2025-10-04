package com.code.codingplatform.service;

import com.code.codingplatform.model.Role;
import com.code.codingplatform.model.User;
import com.code.codingplatform.payload.response.LeaderboardEntry;
import com.code.codingplatform.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class LeaderboardService {

    @Autowired
    private UserRepository userRepository;

    public List<LeaderboardEntry> getLeaderboard() {
        // Get all participants
        List<User> participants = userRepository.findAll().stream()
                .filter(user -> user.getRole() == Role.PARTICIPANT)
                .sorted(Comparator.comparing(User::getGrandTotalScore).reversed())
                .collect(Collectors.toList());

        List<LeaderboardEntry> leaderboard = new ArrayList<>();
        int rank = 1;
        Integer previousScore = null;
        int actualRank = 1;

        for (User participant : participants) {
            // Handle ties - same score gets same rank
            if (previousScore != null && !previousScore.equals(participant.getGrandTotalScore())) {
                rank = actualRank;
            }

            leaderboard.add(new LeaderboardEntry(
                    participant.getId(),
                    participant.getUsername(),
                    participant.getEmail(),
                    participant.getGrandTotalScore(),
                    rank
            ));

            previousScore = participant.getGrandTotalScore();
            actualRank++;
        }

        return leaderboard;
    }
}
