package com.ftn.laslouri.criticomrade.model;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import lombok.Data;

@Entity
@Data //@Getter, @Setter, and @RequiredArgsConstructor IN ONE!
public class PlatformStatistics {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private int userCount;
    private int movieCount;
    private int reviewCount;
    private int commentCount;
    private int reactionCount;
    private int recommendationCount;

}
