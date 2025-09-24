package com.code.codingplatform.repository;

import com.code.codingplatform.model.TestCase;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface TestCaseRepository extends JpaRepository<TestCase, Long> {
    List<TestCase> findByQuestionId(Long questionId);
    List<TestCase> findByQuestionIdAndIsPublic(Long questionId, Boolean isPublic);
}
