package com.ftn.laslouri.criticomrade.repository;

import com.ftn.laslouri.criticomrade.model.ListType;
import com.ftn.laslouri.criticomrade.model.ReviewList;
import com.ftn.laslouri.criticomrade.model.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ReviewListRepository extends JpaRepository<ReviewList, Long> {

    List<ReviewList> findByOwner(User owner);

    List<ReviewList> findByOwnerAndListType(User owner, ListType listType);

    Optional<ReviewList> findFirstByOwnerAndListType(User owner, ListType listType);
}
