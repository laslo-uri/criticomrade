package com.ftn.laslouri.criticomrade.dto;

import com.ftn.laslouri.criticomrade.model.NotificationType;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class NotificationDto {

    private Long id;
    private NotificationType type;
    private String message;
    private boolean read;
    private LocalDateTime createdAt;
    private Long referenceId;
    private UserProfileDto actor;
}
