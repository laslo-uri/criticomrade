package com.ftn.laslouri.criticomrade.controller;

import com.ftn.laslouri.criticomrade.dto.RecommendationCreateRequest;
import com.ftn.laslouri.criticomrade.dto.RecommendationDto;
import com.ftn.laslouri.criticomrade.service.RecommendationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/recommendations")
@RequiredArgsConstructor
public class RecommendationController {

    private final RecommendationService recommendationService;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public RecommendationDto create(@Valid @RequestBody RecommendationCreateRequest request) {
        return recommendationService.create(request);
    }

    @GetMapping("/incoming")
    public List<RecommendationDto> incoming() {
        return recommendationService.getIncoming();
    }

    @GetMapping("/outgoing")
    public List<RecommendationDto> outgoing() {
        return recommendationService.getOutgoing();
    }

    @PostMapping("/{id}/accept")
    public RecommendationDto accept(@PathVariable Long id) {
        return recommendationService.accept(id);
    }

    @PostMapping("/{id}/reject")
    public RecommendationDto reject(@PathVariable Long id) {
        return recommendationService.reject(id);
    }

    @PostMapping("/{id}/complete")
    public RecommendationDto complete(@PathVariable Long id) {
        return recommendationService.complete(id);
    }
}
