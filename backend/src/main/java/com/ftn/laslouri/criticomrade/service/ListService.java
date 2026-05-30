package com.ftn.laslouri.criticomrade.service;

import com.ftn.laslouri.criticomrade.dto.ListCreateRequest;
import com.ftn.laslouri.criticomrade.dto.ListDto;
import com.ftn.laslouri.criticomrade.exception.BadRequestException;
import com.ftn.laslouri.criticomrade.exception.ForbiddenException;
import com.ftn.laslouri.criticomrade.exception.ResourceNotFoundException;
import com.ftn.laslouri.criticomrade.mapper.DtoMapper;
import com.ftn.laslouri.criticomrade.model.*;
import com.ftn.laslouri.criticomrade.repository.MovieListRepository;
import com.ftn.laslouri.criticomrade.repository.ReviewListRepository;
import com.ftn.laslouri.criticomrade.util.SecurityUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ListService {

    private final MovieListRepository movieListRepository;
    private final ReviewListRepository reviewListRepository;
    private final MovieService movieService;
    private final ReviewService reviewService;
    private final SecurityUtils securityUtils;

    @Transactional
    public ListDto createList(ListCreateRequest request) {
        User owner = securityUtils.getCurrentUser();
        LocalDateTime now = LocalDateTime.now();

        return switch (request.getListType()) {
            case WATCHLIST, CUSTOM -> {
                MovieList list = new MovieList();
                list.setOwner(owner);
                list.setName(request.getName());
                list.setListType(request.getListType());
                list.setPrivateList(request.isPrivateList());
                list.setCreationDate(now);
                list.setLastModificationDate(now);
                list.setNumberOfElements(0);
                list.setMovies(new HashSet<>());
                yield DtoMapper.toMovieListDto(movieListRepository.save(list), owner);
            }
            case DIARY -> {
                ReviewList list = new ReviewList();
                list.setOwner(owner);
                list.setName(request.getName());
                list.setListType(ListType.DIARY);
                list.setPrivateList(request.isPrivateList());
                list.setCreationDate(now);
                list.setLastModificationDate(now);
                list.setNumberOfElements(0);
                list.setReviews(new HashSet<>());
                yield DtoMapper.toReviewListDto(reviewListRepository.save(list), owner);
            }
        };
    }

    @Transactional(readOnly = true)
    public List<ListDto> getMyLists(ListType type) {
        User owner = securityUtils.getCurrentUser();
        if (type == ListType.DIARY) {
            return reviewListRepository.findByOwnerAndListType(owner, ListType.DIARY).stream()
                    .map(l -> DtoMapper.toReviewListDto(l, owner))
                    .collect(Collectors.toList());
        }
        List<MovieList> lists = type == null
                ? movieListRepository.findByOwner(owner)
                : movieListRepository.findByOwnerAndListType(owner, type);
        return lists.stream()
                .map(l -> DtoMapper.toMovieListDto(l, owner))
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public ListDto getList(Long id) {
        User viewer = securityUtils.getCurrentUser();
        MovieList movieList = movieListRepository.findById(id).orElse(null);
        if (movieList != null) {
            checkListAccess(movieList.getOwner(), movieList.isPrivateList(), viewer);
            return DtoMapper.toMovieListDto(movieList, viewer);
        }
        ReviewList reviewList = reviewListRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("List not found: " + id));
        checkListAccess(reviewList.getOwner(), reviewList.isPrivateList(), viewer);
        return DtoMapper.toReviewListDto(reviewList, viewer);
    }

    @Transactional
    public ListDto addMovieToList(Long listId, Long tmdbId) {
        User owner = securityUtils.getCurrentUser();
        MovieList list = movieListRepository.findById(listId)
                .orElseThrow(() -> new ResourceNotFoundException("List not found: " + listId));
        if (!list.getOwner().getId().equals(owner.getId())) {
            throw new ForbiddenException("Not authorized to modify this list");
        }
        Movie movie = movieService.findOrFetchEntity(tmdbId);
        if (list.getMovies() == null) {
            list.setMovies(new HashSet<>());
        }
        list.getMovies().add(movie);
        list.setNumberOfElements(list.getMovies().size());
        list.setLastModificationDate(LocalDateTime.now());
        return DtoMapper.toMovieListDto(movieListRepository.save(list), owner);
    }

    @Transactional
    public ListDto addReviewToDiary(Long listId, Long reviewId) {
        User owner = securityUtils.getCurrentUser();
        ReviewList list = reviewListRepository.findById(listId)
                .orElseThrow(() -> new ResourceNotFoundException("List not found: " + listId));
        if (!list.getOwner().getId().equals(owner.getId())) {
            throw new ForbiddenException("Not authorized to modify this list");
        }
        if (list.getListType() != ListType.DIARY) {
            throw new BadRequestException("Only diary lists accept reviews");
        }
        Review review = reviewService.findReview(reviewId);
        if (list.getReviews() == null) {
            list.setReviews(new HashSet<>());
        }
        list.getReviews().add(review);
        list.setNumberOfElements(list.getReviews().size());
        list.setLastModificationDate(LocalDateTime.now());
        return DtoMapper.toReviewListDto(reviewListRepository.save(list), owner);
    }

    @Transactional
    public void removeMovieFromList(Long listId, Long movieId) {
        User owner = securityUtils.getCurrentUser();
        MovieList list = movieListRepository.findById(listId)
                .orElseThrow(() -> new ResourceNotFoundException("List not found: " + listId));
        if (!list.getOwner().getId().equals(owner.getId())) {
            throw new ForbiddenException("Not authorized to modify this list");
        }
        list.getMovies().removeIf(m -> m.getId().equals(movieId));
        list.setNumberOfElements(list.getMovies().size());
        list.setLastModificationDate(LocalDateTime.now());
        movieListRepository.save(list);
    }

    @Transactional
    public void deleteList(Long listId) {
        User owner = securityUtils.getCurrentUser();
        if (movieListRepository.findById(listId).map(list -> {
            if (!list.getOwner().getId().equals(owner.getId())) {
                throw new ForbiddenException("Not authorized to delete this list");
            }
            movieListRepository.delete(list);
            return true;
        }).orElse(false)) {
            return;
        }
        ReviewList reviewList = reviewListRepository.findById(listId)
                .orElseThrow(() -> new ResourceNotFoundException("List not found: " + listId));
        if (!reviewList.getOwner().getId().equals(owner.getId())) {
            throw new ForbiddenException("Not authorized to delete this list");
        }
        reviewListRepository.delete(reviewList);
    }

    @Transactional
    public ListDto getOrCreateWatchlist() {
        User owner = securityUtils.getCurrentUser();
        MovieList list = movieListRepository.findByOwnerAndListType(owner, ListType.WATCHLIST)
                .stream().findFirst()
                .orElseGet(() -> {
                    MovieList watchlist = new MovieList();
                    watchlist.setOwner(owner);
                    watchlist.setName("Watchlist");
                    watchlist.setListType(ListType.WATCHLIST);
                    watchlist.setPrivateList(false);
                    watchlist.setCreationDate(LocalDateTime.now());
                    watchlist.setLastModificationDate(LocalDateTime.now());
                    watchlist.setMovies(new HashSet<>());
                    return movieListRepository.save(watchlist);
                });
        return DtoMapper.toMovieListDto(list, owner);
    }

    @Transactional
    public ListDto getOrCreateDiary() {
        User owner = securityUtils.getCurrentUser();
        ReviewList list = reviewListRepository.findByOwnerAndListType(owner, ListType.DIARY)
                .stream().findFirst()
                .orElseGet(() -> {
                    ReviewList diary = new ReviewList();
                    diary.setOwner(owner);
                    diary.setName("Diary");
                    diary.setListType(ListType.DIARY);
                    diary.setPrivateList(false);
                    diary.setCreationDate(LocalDateTime.now());
                    diary.setLastModificationDate(LocalDateTime.now());
                    diary.setReviews(new HashSet<>());
                    return reviewListRepository.save(diary);
                });
        return DtoMapper.toReviewListDto(list, owner);
    }

    private void checkListAccess(User owner, boolean isPrivate, User viewer) {
        if (isPrivate && !owner.getId().equals(viewer.getId())) {
            throw new ForbiddenException("List is private");
        }
    }
}
