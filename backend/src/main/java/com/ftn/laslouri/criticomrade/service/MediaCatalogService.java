package com.ftn.laslouri.criticomrade.service;

import com.ftn.laslouri.criticomrade.dto.CreditsDto;
import com.ftn.laslouri.criticomrade.dto.MovieDto;
import com.ftn.laslouri.criticomrade.exception.BadRequestException;
import com.ftn.laslouri.criticomrade.exception.ResourceNotFoundException;
import com.ftn.laslouri.criticomrade.mapper.DtoMapper;
import com.ftn.laslouri.criticomrade.model.MediaType;
import com.ftn.laslouri.criticomrade.model.Movie;
import com.ftn.laslouri.criticomrade.repository.MovieRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class MediaCatalogService {

    private final MovieRepository movieRepository;
    private final MovieService movieService;
    private final RestTemplate restTemplate;

    @Value("${criticomrade.tmdb.api-key:}")
    private String tmdbApiKey;

    @Value("${criticomrade.tmdb.base-url:https://api.themoviedb.org/3}")
    private String tmdbBaseUrl;

    @Value("${criticomrade.spotify.client-id:}")
    private String spotifyClientId;

    @Value("${criticomrade.spotify.client-secret:}")
    private String spotifyClientSecret;

    private String spotifyToken;
    private long spotifyTokenExpiresAt;

    @Transactional(readOnly = true)
    public List<MovieDto> search(MediaType type, String query) {
        if (query == null || query.isBlank()) {
            return List.of();
        }
        return switch (type) {
            case FILM -> movieService.searchTmdb(query);
            case SHOW -> searchTv(query);
            case BOOK -> searchBooks(query);
            case ALBUM -> searchAlbums(query);
            case EPISODE -> List.of();
        };
    }

    @Transactional(readOnly = true)
    public List<MovieDto> popular(MediaType type) {
        return switch (type) {
            case FILM -> movieService.getPopular();
            case SHOW -> popularTv();
            case BOOK -> searchBooks("fiction");
            case ALBUM -> {
                List<MovieDto> fresh = spotifyNewReleases();
                yield fresh.isEmpty() ? searchAlbums("album") : fresh;
            }
            case EPISODE -> List.of();
        };
    }

    @Transactional(readOnly = true)
    public CreditsDto credits(MediaType type, String key) {
        return switch (type) {
            case FILM -> CreditsDto.builder().cast(tmdbCast("/movie/" + key + "/credits")).tracks(List.of()).build();
            case SHOW -> CreditsDto.builder().cast(tmdbCast("/tv/" + key + "/credits")).tracks(List.of()).build();
            case ALBUM -> CreditsDto.builder().cast(List.of()).tracks(albumTracks(key)).build();
            default -> CreditsDto.builder().cast(List.of()).tracks(List.of()).build();
        };
    }

    @Transactional
    public MovieDto resolve(MediaType type, String key) {
        if (key == null || key.isBlank()) {
            throw new BadRequestException("Missing media key");
        }
        if (type == MediaType.FILM && key.chars().allMatch(Character::isDigit)) {
            return movieService.getOrFetchByTmdbId(Long.parseLong(key));
        }
        String externalKey = externalKey(type, key);
        return movieRepository.findByExternalKey(externalKey)
                .map(DtoMapper::toMovieDto)
                .orElseGet(() -> DtoMapper.toMovieDto(fetchAndSave(type, key, externalKey)));
    }

    @SuppressWarnings("unchecked")
    private List<MovieDto> searchTv(String query) {
        requireTmdb();
        Map<String, Object> response = getJson(tmdbBaseUrl + "/search/tv", Map.of("api_key", tmdbApiKey, "query", query));
        return mapTmdbList(response, MediaType.SHOW, "name", "first_air_date", "tv:");
    }

    @SuppressWarnings("unchecked")
    private List<MovieDto> popularTv() {
        requireTmdb();
        Map<String, Object> response = getJson(tmdbBaseUrl + "/tv/popular", Map.of("api_key", tmdbApiKey));
        return mapTmdbList(response, MediaType.SHOW, "name", "first_air_date", "tv:");
    }

    @SuppressWarnings("unchecked")
    private List<MovieDto> searchBooks(String query) {
        Map<String, Object> response = getJson("https://openlibrary.org/search.json", Map.of("q", query, "limit", "12"));
        if (response == null || !(response.get("docs") instanceof List<?> docs)) {
            return List.of();
        }
        List<MovieDto> items = new ArrayList<>();
        for (Object doc : docs) {
            if (!(doc instanceof Map<?, ?> item)) {
                continue;
            }
            String key = item.get("key") instanceof String raw ? raw.replace("/works/", "") : null;
            String cover = item.get("cover_i") instanceof Number coverId
                    ? "https://covers.openlibrary.org/b/id/" + coverId.intValue() + "-L.jpg" : null;
            String year = item.get("first_publish_year") == null ? null : String.valueOf(item.get("first_publish_year"));
            String author = null;
            if (item.get("author_name") instanceof List<?> authors && !authors.isEmpty()) {
                author = String.valueOf(authors.get(0));
            }
            items.add(MovieDto.builder()
                    .mediaType(MediaType.BOOK.name())
                    .externalKey(key == null ? null : "ol:" + key)
                    .title(item.get("title") == null ? "Untitled" : String.valueOf(item.get("title")))
                    .creator(author)
                    .year(year)
                    .posterApiLink(cover)
                    .build());
        }
        return items;
    }

    @SuppressWarnings("unchecked")
    private List<MovieDto> searchAlbums(String query) {
        List<MovieDto> spotify = searchSpotifyAlbums(query);
        if (!spotify.isEmpty()) {
            return spotify;
        }
        return searchMusicBrainzAlbums(query);
    }

    @SuppressWarnings("unchecked")
    private List<MovieDto> searchMusicBrainzAlbums(String query) {
        Map<String, Object> response = getJson(
                "https://musicbrainz.org/ws/2/release-group/",
                Map.of("query", query, "fmt", "json", "limit", "12"));
        if (response == null || !(response.get("release-groups") instanceof List<?> groups)) {
            return List.of();
        }
        List<MovieDto> items = new ArrayList<>();
        for (Object group : groups) {
            if (!(group instanceof Map<?, ?> item)) {
                continue;
            }
            String id = item.get("id") == null ? null : String.valueOf(item.get("id"));
            String artist = null;
            if (item.get("artist-credit") instanceof List<?> credits && !credits.isEmpty()
                    && credits.get(0) instanceof Map<?, ?> credit) {
                artist = credit.get("name") == null ? null : String.valueOf(credit.get("name"));
            }
            String year = null;
            if (item.get("first-release-date") instanceof String date && date.length() >= 4) {
                year = date.substring(0, 4);
            }
            items.add(MovieDto.builder()
                    .mediaType(MediaType.ALBUM.name())
                    .externalKey(id == null ? null : "mb:" + id)
                    .title(item.get("title") == null ? "Untitled" : String.valueOf(item.get("title")))
                    .creator(artist)
                    .year(year)
                    .posterApiLink(id == null ? null : "https://coverartarchive.org/release-group/" + id + "/front-250")
                    .build());
        }
        return items;
    }

    @SuppressWarnings("unchecked")
    private Movie fetchAndSave(MediaType type, String key, String externalKey) {
        Movie movie = new Movie();
        movie.setMediaType(type);
        movie.setExternalKey(externalKey);
        switch (type) {
            case SHOW -> {
                requireTmdb();
                Map<String, Object> data = getJson(tmdbBaseUrl + "/tv/" + key, Map.of("api_key", tmdbApiKey));
                if (data == null || data.get("name") == null) {
                    throw new ResourceNotFoundException("Show not found");
                }
                movie.setTitle(String.valueOf(data.get("name")));
                movie.setDescription((String) data.get("overview"));
                movie.setNetwork(data.get("networks") instanceof List<?> networks && !networks.isEmpty()
                        && networks.get(0) instanceof Map<?, ?> network ? String.valueOf(network.get("name")) : null);
                if (data.get("number_of_seasons") instanceof Number seasons) {
                    movie.setSeasonCount(seasons.intValue());
                }
                applyTmdbArt(movie, data, "first_air_date");
                applyGenres(movie, data);
            }
            case BOOK -> {
                Map<String, Object> data = getJson("https://openlibrary.org/works/" + key + ".json", Map.of());
                if (data == null || data.get("title") == null) {
                    throw new ResourceNotFoundException("Book not found");
                }
                movie.setTitle(String.valueOf(data.get("title")));
                if (data.get("description") instanceof String description) {
                    movie.setDescription(description);
                } else if (data.get("description") instanceof Map<?, ?> wrapped && wrapped.get("value") != null) {
                    movie.setDescription(String.valueOf(wrapped.get("value")));
                }
                if (data.get("covers") instanceof List<?> covers && !covers.isEmpty()) {
                    movie.setPosterApiLink("https://covers.openlibrary.org/b/id/" + covers.get(0) + "-L.jpg");
                }
                if (data.get("number_of_pages") instanceof Number pages) {
                    movie.setPageCount(pages.intValue());
                }
            }
            case EPISODE -> {
                requireTmdb();
                String raw = key.startsWith("tv:") ? key.substring(3) : key;
                String[] parts = raw.split(":");
                if (parts.length < 3) {
                    throw new BadRequestException("Episode key must be showId:season:episode");
                }
                Map<String, Object> data = getJson(
                        tmdbBaseUrl + "/tv/" + parts[0] + "/season/" + parts[1] + "/episode/" + parts[2],
                        Map.of("api_key", tmdbApiKey));
                if (data == null || data.get("name") == null) {
                    throw new ResourceNotFoundException("Episode not found");
                }
                movie.setTitle(String.valueOf(data.get("name")));
                movie.setDescription(data.get("overview") instanceof String overview ? overview : null);
                movie.setSeasonNumber(Integer.parseInt(parts[1]));
                movie.setEpisodeNumber(Integer.parseInt(parts[2]));
                applyTmdbArt(movie, data, "air_date");
                movieRepository.findByExternalKey("tv:" + parts[0]).ifPresent(movie::setParent);
            }
            case ALBUM -> {
                if (key.startsWith("sp:") || (externalKey != null && externalKey.startsWith("sp:"))) {
                    String spotifyId = key.startsWith("sp:") ? key.substring(3) : externalKey.substring(3);
                    applySpotifyAlbum(movie, spotifyId);
                } else {
                Map<String, Object> data = getJson(
                        "https://musicbrainz.org/ws/2/release-group/" + key,
                        Map.of("fmt", "json", "inc", "artists"));
                if (data == null || data.get("title") == null) {
                    throw new ResourceNotFoundException("Album not found");
                }
                movie.setTitle(String.valueOf(data.get("title")));
                if (data.get("artist-credit") instanceof List<?> credits && !credits.isEmpty()
                        && credits.get(0) instanceof Map<?, ?> credit) {
                    movie.setCreator(String.valueOf(credit.get("name")));
                }
                if (data.get("first-release-date") instanceof String date && date.length() >= 4) {
                    movie.setYear(date.substring(0, 4));
                }
                movie.setPosterApiLink("https://coverartarchive.org/release-group/" + key + "/front-250");
                }
            }
            default -> throw new BadRequestException("Unsupported media type");
        }
        return movieRepository.save(movie);
    }

    private void applyTmdbArt(Movie movie, Map<String, Object> data, String dateField) {
        if (data.get("poster_path") != null) {
            movie.setPosterApiLink("https://image.tmdb.org/t/p/w500" + data.get("poster_path"));
        }
        if (data.get("backdrop_path") != null) {
            movie.setBackdropApiLink("https://image.tmdb.org/t/p/w780" + data.get("backdrop_path"));
        }
        if (data.get(dateField) instanceof String date && date.length() >= 4) {
            movie.setYear(date.substring(0, 4));
        }
        if (data.get("vote_average") instanceof Number vote) {
            movie.setImdbRating(vote.doubleValue());
        }
    }

    @SuppressWarnings("unchecked")
    private void applyGenres(Movie movie, Map<String, Object> data) {
        if (data.get("genres") instanceof List<?> genres) {
            movie.setGenre(genres.stream()
                    .filter(Map.class::isInstance)
                    .map(g -> String.valueOf(((Map<?, ?>) g).get("name")))
                    .reduce((a, b) -> a + ", " + b)
                    .orElse(null));
        }
    }

    @SuppressWarnings("unchecked")
    private List<MovieDto> mapTmdbList(Map<String, Object> response, MediaType type, String titleKey, String dateKey, String prefix) {
        if (response == null || !(response.get("results") instanceof List<?> results)) {
            return List.of();
        }
        List<MovieDto> items = new ArrayList<>();
        for (Object result : results) {
            if (!(result instanceof Map<?, ?> item)) {
                continue;
            }
            Long id = item.get("id") instanceof Number number ? number.longValue() : null;
            String year = item.get(dateKey) instanceof String date && date.length() >= 4 ? date.substring(0, 4) : null;
            items.add(MovieDto.builder()
                    .mediaType(type.name())
                    .externalKey(id == null ? null : prefix + id)
                    .title(item.get(titleKey) == null ? "Untitled" : String.valueOf(item.get(titleKey)))
                    .description(item.get("overview") == null ? null : String.valueOf(item.get("overview")))
                    .year(year)
                    .posterApiLink(item.get("poster_path") == null ? null : "https://image.tmdb.org/t/p/w500" + item.get("poster_path"))
                    .imdbRating(item.get("vote_average") instanceof Number vote ? vote.doubleValue() : null)
                    .build());
        }
        return items;
    }

    private String externalKey(MediaType type, String key) {
        return switch (type) {
            case FILM -> key.startsWith("tmdb:") ? key : "tmdb:" + key;
            case SHOW, EPISODE -> key.startsWith("tv:") ? key : "tv:" + key;
            case BOOK -> key.startsWith("ol:") ? key : "ol:" + key;
            case ALBUM -> key.startsWith("mb:") || key.startsWith("sp:") ? key : "mb:" + key;
        };
    }

    @SuppressWarnings("unchecked")
    private List<String> tmdbCast(String path) {
        if (tmdbApiKey == null || tmdbApiKey.isBlank()) {
            return List.of();
        }
        Map<String, Object> data = getJson(tmdbBaseUrl + path, Map.of("api_key", tmdbApiKey));
        if (data == null || !(data.get("cast") instanceof List<?> cast)) {
            return List.of();
        }
        List<String> names = new ArrayList<>();
        for (Object person : cast) {
            if (names.size() >= 8) {
                break;
            }
            if (person instanceof Map<?, ?> credit && credit.get("name") != null) {
                names.add(String.valueOf(credit.get("name")));
            }
        }
        return names;
    }

    private List<String> albumTracks(String key) {
        if (key == null) {
            return List.of();
        }
        String spotifyId = key.startsWith("sp:") ? key.substring(3) : null;
        if (spotifyId == null) {
            return List.of();
        }
        String token = spotifyAccessToken();
        if (token == null) {
            return List.of();
        }
        Map<String, Object> data = getSpotify("https://api.spotify.com/v1/albums/" + spotifyId + "/tracks?limit=20", token);
        return spotifyTrackNames(data);
    }

    @SuppressWarnings("unchecked")
    private List<MovieDto> searchSpotifyAlbums(String query) {
        String token = spotifyAccessToken();
        if (token == null) {
            return List.of();
        }
        String encoded = java.net.URLEncoder.encode(query, java.nio.charset.StandardCharsets.UTF_8);
        Map<String, Object> data = getSpotify(
                "https://api.spotify.com/v1/search?type=album&limit=12&q=" + encoded,
                token);
        if (data == null || !(data.get("albums") instanceof Map<?, ?> albums) || !(albums.get("items") instanceof List<?> items)) {
            return List.of();
        }
        return mapSpotifyAlbums(items);
    }

    @SuppressWarnings("unchecked")
    private List<MovieDto> spotifyNewReleases() {
        String token = spotifyAccessToken();
        if (token == null) {
            return List.of();
        }
        Map<String, Object> data = getSpotify("https://api.spotify.com/v1/browse/new-releases?limit=12", token);
        if (data == null || !(data.get("albums") instanceof Map<?, ?> albums) || !(albums.get("items") instanceof List<?> items)) {
            return List.of();
        }
        return mapSpotifyAlbums(items);
    }

    private List<MovieDto> mapSpotifyAlbums(List<?> items) {
        List<MovieDto> albums = new ArrayList<>();
        for (Object item : items) {
            if (!(item instanceof Map<?, ?> album) || album.get("id") == null) {
                continue;
            }
            String artist = null;
            if (album.get("artists") instanceof List<?> artists && !artists.isEmpty() && artists.get(0) instanceof Map<?, ?> credit) {
                artist = credit.get("name") == null ? null : String.valueOf(credit.get("name"));
            }
            String image = null;
            if (album.get("images") instanceof List<?> images && !images.isEmpty() && images.get(0) instanceof Map<?, ?> cover) {
                image = cover.get("url") == null ? null : String.valueOf(cover.get("url"));
            }
            String year = album.get("release_date") instanceof String date && date.length() >= 4 ? date.substring(0, 4) : null;
            albums.add(MovieDto.builder()
                    .mediaType(MediaType.ALBUM.name())
                    .externalKey("sp:" + album.get("id"))
                    .title(album.get("name") == null ? "Untitled" : String.valueOf(album.get("name")))
                    .creator(artist)
                    .year(year)
                    .posterApiLink(image)
                    .trackCount(album.get("total_tracks") instanceof Number tracks ? tracks.intValue() : null)
                    .build());
        }
        return albums;
    }

    @SuppressWarnings("unchecked")
    private void applySpotifyAlbum(Movie movie, String spotifyId) {
        String token = spotifyAccessToken();
        Map<String, Object> data = token == null ? null : getSpotify("https://api.spotify.com/v1/albums/" + spotifyId, token);
        if (data == null || data.get("name") == null) {
            throw new ResourceNotFoundException("Album not found");
        }
        movie.setTitle(String.valueOf(data.get("name")));
        if (data.get("artists") instanceof List<?> artists && !artists.isEmpty() && artists.get(0) instanceof Map<?, ?> credit) {
            movie.setCreator(String.valueOf(credit.get("name")));
        }
        if (data.get("release_date") instanceof String date && date.length() >= 4) {
            movie.setYear(date.substring(0, 4));
        }
        if (data.get("total_tracks") instanceof Number tracks) {
            movie.setTrackCount(tracks.intValue());
        }
        if (data.get("images") instanceof List<?> images && !images.isEmpty() && images.get(0) instanceof Map<?, ?> cover) {
            movie.setPosterApiLink(String.valueOf(cover.get("url")));
        }
    }

    @SuppressWarnings("unchecked")
    private List<String> spotifyTrackNames(Map<String, Object> data) {
        if (data == null || !(data.get("items") instanceof List<?> items)) {
            return List.of();
        }
        List<String> names = new ArrayList<>();
        for (Object item : items) {
            if (item instanceof Map<?, ?> track && track.get("name") != null) {
                names.add(String.valueOf(track.get("name")));
            }
        }
        return names;
    }

    @SuppressWarnings("unchecked")
    private String spotifyAccessToken() {
        if (spotifyClientId == null || spotifyClientId.isBlank() || spotifyClientSecret == null || spotifyClientSecret.isBlank()) {
            return null;
        }
        if (spotifyToken != null && System.currentTimeMillis() < spotifyTokenExpiresAt) {
            return spotifyToken;
        }
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setBasicAuth(spotifyClientId, spotifyClientSecret);
            headers.setContentType(org.springframework.http.MediaType.APPLICATION_FORM_URLENCODED);
            Map<String, Object> body = restTemplate.exchange(
                    "https://accounts.spotify.com/api/token",
                    HttpMethod.POST,
                    new HttpEntity<>("grant_type=client_credentials", headers),
                    Map.class).getBody();
            if (body == null || body.get("access_token") == null) {
                return null;
            }
            spotifyToken = String.valueOf(body.get("access_token"));
            int seconds = body.get("expires_in") instanceof Number expires ? expires.intValue() : 3600;
            spotifyTokenExpiresAt = System.currentTimeMillis() + Math.max(30, seconds - 30) * 1000L;
            return spotifyToken;
        } catch (Exception ex) {
            return null;
        }
    }

    @SuppressWarnings("unchecked")
    private Map<String, Object> getSpotify(String url, String token) {
        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(token);
        headers.set("Accept", "application/json");
        try {
            return restTemplate.exchange(url, HttpMethod.GET, new HttpEntity<>(headers), Map.class).getBody();
        } catch (Exception ex) {
            return Map.of();
        }
    }

    private void requireTmdb() {
        if (tmdbApiKey == null || tmdbApiKey.isBlank()) {
            throw new BadRequestException("TMDB API key is not configured");
        }
    }

    @SuppressWarnings("unchecked")
    private Map<String, Object> getJson(String base, Map<String, String> query) {
        UriComponentsBuilder builder = UriComponentsBuilder.fromHttpUrl(base);
        query.forEach(builder::queryParam);
        HttpHeaders headers = new HttpHeaders();
        headers.set("User-Agent", "CritiComrade/1.0 (https://github.com/laslo-uri/CritiComrade)");
        headers.set("Accept", "application/json");
        try {
            return restTemplate.exchange(builder.toUriString(), HttpMethod.GET, new HttpEntity<>(headers), Map.class).getBody();
        } catch (Exception ex) {
            return Map.of();
        }
    }
}
