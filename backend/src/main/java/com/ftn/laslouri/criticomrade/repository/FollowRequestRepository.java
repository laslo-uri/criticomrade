package com.ftn.laslouri.criticomrade.repository;

import com.ftn.laslouri.criticomrade.model.FollowRequest;
import com.ftn.laslouri.criticomrade.model.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface FollowRequestRepository extends JpaRepository<FollowRequest, Long> {

    List<FollowRequest> findByReceiver(User receiver);

    Optional<FollowRequest> findBySenderAndReceiver(User sender, User receiver);

    boolean existsBySenderAndReceiver(User sender, User receiver);
}
