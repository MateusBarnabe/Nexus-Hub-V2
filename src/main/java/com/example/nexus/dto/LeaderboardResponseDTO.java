package com.example.nexus.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.List;

/**
 * DTO para representar a resposta do leaderboard (ranking).
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LeaderboardResponseDTO {
    private List<LeaderboardEntryDTO> results;
    private String period;
    private Long gameId;
    private int page;
    private int limit;
    private int totalPages;
    private int totalResults;
}
