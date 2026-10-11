package com.cpi.cpi_backend.repository;

import com.cpi.cpi_backend.entity.Notification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, Long> {

    List<Notification> findByCoachIdOrderByCreatedAtDesc(Long coachId);

    List<Notification> findByCoachIdAndIsReadFalseOrderByCreatedAtDesc(Long coachId);

    long countByCoachIdAndIsReadFalse(Long coachId);

    Optional<Notification> findByIdAndCoachId(Long id, Long coachId);

    boolean existsByCoachIdAndDedupKey(Long coachId, String dedupKey);

    @Modifying
    @Transactional
    @Query("UPDATE Notification n SET n.isRead = true WHERE n.coach.id = :coachId AND n.isRead = false")
    int markAllAsReadByCoachId(@Param("coachId") Long coachId);

    @Modifying
    @Transactional
    @Query("DELETE FROM Notification n WHERE n.coach.id = :coachId")
    int deleteAllByCoachId(@Param("coachId") Long coachId);
}
