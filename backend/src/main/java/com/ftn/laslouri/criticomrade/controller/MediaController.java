package com.ftn.laslouri.criticomrade.controller;

import com.ftn.laslouri.criticomrade.dto.CreditsDto;
import com.ftn.laslouri.criticomrade.dto.MovieDto;
import com.ftn.laslouri.criticomrade.model.MediaType;
import com.ftn.laslouri.criticomrade.service.MediaCatalogService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/media")
@RequiredArgsConstructor
public class MediaController {

    private final MediaCatalogService mediaCatalogService;

    @GetMapping("/search")
    public List<MovieDto> search(@RequestParam(defaultValue = "FILM") MediaType type, @RequestParam String q) {
        return mediaCatalogService.search(type, q);
    }

    @GetMapping("/popular")
    public List<MovieDto> popular(@RequestParam(defaultValue = "FILM") MediaType type) {
        return mediaCatalogService.popular(type);
    }

    @GetMapping("/resolve")
    public MovieDto resolve(@RequestParam MediaType type, @RequestParam String key) {
        return mediaCatalogService.resolve(type, key);
    }

    @GetMapping("/credits")
    public CreditsDto credits(@RequestParam MediaType type, @RequestParam String key) {
        return mediaCatalogService.credits(type, key);
    }
}
