package com.ftn.laslouri.criticomrade.mapper;

import com.ftn.laslouri.criticomrade.dto.*;
import com.ftn.laslouri.criticomrade.model.*;
import org.springframework.data.domain.Page;

import java.util.Collections;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

public final class DtoMapper {

    private DtoMapper() {
    }

    public static UserProfileDto toUserProfile(User user) {
        return toUserProfile(user, null);
    }

    public static UserProfileDto toUserProfile(User user, User viewer) {
        if (user == null) {
            return null;
        }
        boolean following = viewer != null && user.getFollowers() != null
                && user.getFollowers().stream().anyMatch(f -> f.getId().equals(viewer.getId()));
        return UserProfileDto.builder()
                .id(user.getId())
                .username(user.getUsername())
                .email(viewer != null && viewer.getId().equals(user.getId()) ? user.getEmail() : null)
                .fullName(user.getFullName())
                .bio(user.getBio())
                .avatarUrl(user.getAvatarUrl())
                .profilePublic(user.isProfilePublic())
                .gainedChallengePoints(user.getGainedChallengePoints())
                .followerCount(user.getFollowers() == null ? 0 : user.getFollowers().size())
                .followingCount(user.getFollowing() == null ? 0 : user.getFollowing().size())
                .following(following)
                .build();
    }

    public static MovieDto toMovieDto(Movie movie) {
        if (movie == null) {
            return null;
        }
        return MovieDto.builder()
                .id(movie.getId())
                .tmdbId(movie.getTmdbId())
                .mediaType(movie.getMediaType() == null ? MediaType.FILM.name() : movie.getMediaType().name())
                .externalKey(movie.getExternalKey())
                .creator(movie.getCreator())
                .backdropApiLink(movie.getBackdropApiLink())
                .network(movie.getNetwork())
                .seasonCount(movie.getSeasonCount())
                .seasonNumber(movie.getSeasonNumber())
                .episodeNumber(movie.getEpisodeNumber())
                .pageCount(movie.getPageCount())
                .trackCount(movie.getTrackCount())
                .title(movie.getTitle())
                .description(movie.getDescription())
                .genre(movie.getGenre())
                .year(movie.getYear())
                .letterboxdLink(movie.getLetterboxdLink())
                .imdbLink(movie.getImdbLink())
                .rottenTomatoesLink(movie.getRottenTomatoesLink())
                .youtubeTrailerLink(movie.getYoutubeTrailerLink())
                .posterApiLink(movie.getPosterApiLink())
                .imdbRating(movie.getImdbRating())
                .rottenTomatoesRating(movie.getRottenTomatoesRating())
                .build();
    }

    public static ReviewDto toReviewDto(Review review, User viewer, List<ReactionSummaryDto> reactions, long commentCount) {
        if (review == null) {
            return null;
        }
        return ReviewDto.builder()
                .id(review.getId())
                .rating(review.getRating())
                .text(review.getText())
                .movie(toMovieDto(review.getMovie()))
                .author(toUserProfile(review.getUser(), viewer))
                .dateWatched(review.getDateWatched())
                .seenBefore(review.isSeenBefore())
                .spoiler(review.isContainedSpoiler())
                .reviewTime(review.getReviewTime())
                .lastUpdated(review.getLastUpdated())
                .commentCount(commentCount)
                .reactions(reactions)
                .build();
    }

    public static CommentDto toCommentDto(Comment comment, User viewer, List<ReactionSummaryDto> reactions) {
        if (comment == null) {
            return null;
        }
        return CommentDto.builder()
                .id(comment.getId())
                .text(comment.getText())
                .author(toUserProfile(comment.getUser(), viewer))
                .reviewId(comment.getReview() != null ? comment.getReview().getId() : null)
                .commentTime(comment.getCommentTime())
                .reactions(reactions)
                .build();
    }

    public static ListDto toMovieListDto(MovieList list, User viewer) {
        return ListDto.builder()
                .id(list.getId())
                .name(list.getName())
                .listType(list.getListType())
                .privateList(list.isPrivateList())
                .numberOfElements(list.getNumberOfElements())
                .creationDate(list.getCreationDate())
                .lastModificationDate(list.getLastModificationDate())
                .owner(toUserProfile(list.getOwner(), viewer))
                .movies(list.getMovies() == null ? Collections.emptyList() :
                        list.getMovies().stream().map(DtoMapper::toMovieDto).collect(Collectors.toList()))
                .build();
    }

    public static ListDto toReviewListDto(ReviewList list, User viewer) {
        return ListDto.builder()
                .id(list.getId())
                .name(list.getName())
                .listType(list.getListType())
                .privateList(list.isPrivateList())
                .numberOfElements(list.getNumberOfElements())
                .creationDate(list.getCreationDate())
                .lastModificationDate(list.getLastModificationDate())
                .owner(toUserProfile(list.getOwner(), viewer))
                .reviews(list.getReviews() == null ? Collections.emptyList() :
                        list.getReviews().stream()
                                .map(r -> toReviewDto(r, viewer, Collections.emptyList(), 0))
                                .collect(Collectors.toList()))
                .build();
    }

    public static FollowRequestDto toFollowRequestDto(FollowRequest request) {
        return FollowRequestDto.builder()
                .id(request.getId())
                .sender(toUserProfile(request.getSender()))
                .receiver(toUserProfile(request.getReceiver()))
                .requestDateTime(request.getRequestDateTime())
                .build();
    }

    public static RecommendationDto toRecommendationDto(Recommendation recommendation, User viewer) {
        return RecommendationDto.builder()
                .id(recommendation.getId())
                .fromUser(toUserProfile(recommendation.getFromUser(), viewer))
                .toUser(toUserProfile(recommendation.getToUser(), viewer))
                .movie(toMovieDto(recommendation.getMovie()))
                .status(recommendation.getStatus())
                .creationTime(recommendation.getCreationTime())
                .challengeDurationDays(recommendation.getChallengeDurationDays())
                .endTime(recommendation.getEndTime())
                .challengePoints(recommendation.getChallengePoints())
                .build();
    }

    public static NotificationDto toNotificationDto(Notification notification, User viewer) {
        return NotificationDto.builder()
                .id(notification.getId())
                .type(notification.getType())
                .message(notification.getMessage())
                .read(notification.isRead())
                .createdAt(notification.getCreatedAt())
                .referenceId(notification.getReferenceId())
                .actor(notification.getActor() != null ? toUserProfile(notification.getActor(), viewer) : null)
                .build();
    }

    public static PlatformStatsDto toPlatformStatsDto(PlatformStatistics stats) {
        return PlatformStatsDto.builder()
                .userCount(stats.getUserCount())
                .movieCount(stats.getMovieCount())
                .reviewCount(stats.getReviewCount())
                .commentCount(stats.getCommentCount())
                .reactionCount(stats.getReactionCount())
                .recommendationCount(stats.getRecommendationCount())
                .build();
    }

    public static <T> PageResponse<T> toPageResponse(Page<T> page) {
        return PageResponse.<T>builder()
                .content(page.getContent())
                .page(page.getNumber())
                .size(page.getSize())
                .totalElements(page.getTotalElements())
                .totalPages(page.getTotalPages())
                .build();
    }

    public static List<ReactionSummaryDto> summarizeReactions(Set<? extends Reaction> reactions, User viewer) {
        if (reactions == null || reactions.isEmpty()) {
            return Collections.emptyList();
        }
        return reactions.stream()
                .collect(Collectors.groupingBy(Reaction::getReactionType, Collectors.counting()))
                .entrySet().stream()
                .map(entry -> ReactionSummaryDto.builder()
                        .type(entry.getKey())
                        .count(entry.getValue())
                        .reactedByCurrentUser(viewer != null && reactions.stream()
                                .anyMatch(r -> r.getUser().getId().equals(viewer.getId())
                                        && r.getReactionType() == entry.getKey()))
                        .build())
                .collect(Collectors.toList());
    }
}
