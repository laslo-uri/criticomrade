package com.ftn.laslouri.criticomrade.repository;

import com.ftn.laslouri.criticomrade.model.Notification;
import com.ftn.laslouri.criticomrade.model.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface NotificationRepository extends JpaRepository<Notification, Long> {

    Page<Notification> findByRecipientOrderByCreatedAtDesc(User recipient, Pageable pageable);

    long countByRecipientAndReadFalse(User recipient);
}
