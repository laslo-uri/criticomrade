package com.ftn.laslouri.criticomrade.controller;

import com.ftn.laslouri.criticomrade.dto.ListCreateRequest;
import com.ftn.laslouri.criticomrade.dto.ListDto;
import com.ftn.laslouri.criticomrade.model.ListType;
import com.ftn.laslouri.criticomrade.service.ListService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/lists")
@RequiredArgsConstructor
public class ListController {

    private final ListService listService;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ListDto create(@Valid @RequestBody ListCreateRequest request) {
        return listService.createList(request);
    }

    @GetMapping
    public List<ListDto> getMyLists(@RequestParam(required = false) ListType type) {
        return listService.getMyLists(type);
    }

    @GetMapping("/watchlist")
    public ListDto getWatchlist() {
        return listService.getOrCreateWatchlist();
    }

    @GetMapping("/diary")
    public ListDto getDiary() {
        return listService.getOrCreateDiary();
    }

    @GetMapping("/{id}")
    public ListDto getById(@PathVariable Long id) {
        return listService.getList(id);
    }

    @PostMapping("/{id}/movies/{tmdbId}")
    public ListDto addMovie(@PathVariable Long id, @PathVariable Long tmdbId) {
        return listService.addMovieToList(id, tmdbId);
    }

    @PostMapping("/{id}/reviews/{reviewId}")
    public ListDto addReview(@PathVariable Long id, @PathVariable Long reviewId) {
        return listService.addReviewToDiary(id, reviewId);
    }

    @DeleteMapping("/{id}/movies/{movieId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void removeMovie(@PathVariable Long id, @PathVariable Long movieId) {
        listService.removeMovieFromList(id, movieId);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) {
        listService.deleteList(id);
    }
}
