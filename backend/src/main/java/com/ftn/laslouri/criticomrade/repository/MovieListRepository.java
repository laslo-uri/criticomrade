package com.ftn.laslouri.criticomrade.repository;

import com.ftn.laslouri.criticomrade.model.ListType;
import com.ftn.laslouri.criticomrade.model.MovieList;
import com.ftn.laslouri.criticomrade.model.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface MovieListRepository extends JpaRepository<MovieList, Long> {

    List<MovieList> findByOwner(User owner);

    List<MovieList> findByOwnerAndListType(User owner, ListType listType);

    Optional<MovieList> findByOwnerAndListTypeAndName(User owner, ListType listType, String name);
}
