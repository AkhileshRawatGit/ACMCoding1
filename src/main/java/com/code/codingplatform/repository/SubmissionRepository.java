package com.code.codingplatform.repository;

import com.code.codingplatform.model.Submission;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SubmissionRepository extends JpaRepository<Submission, Long> {
    @Query("SELECT s FROM Submission s WHERE s.user.id = :userId AND s.question.id = :questionId ORDER BY s.obtainedMarks DESC")
    List<Submission> findByUserIdAndQuestionIdOrderByObtainedMarksDesc(Long userId, Long questionId);

    List<Submission> findByUserId(Long userId);
}
