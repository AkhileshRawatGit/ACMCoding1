package com.code.codingplatform.repository;

import com.code.codingplatform.model.CodeDraft;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface CodeDraftRepository extends JpaRepository<CodeDraft, Long> {
    Optional<CodeDraft> findByUserIdAndQuestionId(Long userId, Long questionId);
}
