package com.ftn.laslouri.criticomrade.repository;

import com.ftn.laslouri.criticomrade.model.Recommendation;
import com.ftn.laslouri.criticomrade.model.RecommendationStatus;
import com.ftn.laslouri.criticomrade.model.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface RecommendationRepository extends JpaRepository<Recommendation, Long> {

    List<Recommendation> findByToUserOrderByCreationTimeDesc(User toUser);

    List<Recommendation> findByFromUserOrderByCreationTimeDesc(User fromUser);

    List<Recommendation> findByToUserAndStatus(User toUser, RecommendationStatus status);
}
