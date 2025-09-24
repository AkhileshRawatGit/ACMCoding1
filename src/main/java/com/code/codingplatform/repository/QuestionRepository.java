package com.code.codingplatform.repository;

import com.code.codingplatform.model.Question;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface QuestionRepository extends JpaRepository<Question, Long> {
    // Custom queries if needed, otherwise JpaRepository provides basic CRUD
}
