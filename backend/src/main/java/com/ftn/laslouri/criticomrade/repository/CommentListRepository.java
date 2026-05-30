package com.ftn.laslouri.criticomrade.repository;

import com.ftn.laslouri.criticomrade.model.CommentList;
import com.ftn.laslouri.criticomrade.model.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface CommentListRepository extends JpaRepository<CommentList, Long> {

    List<CommentList> findByOwner(User owner);
}
