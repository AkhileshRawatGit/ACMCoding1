package com.code.codingplatform.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "questions")
public class Question {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String title;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Difficulty difficulty;

    @Enumerated(EnumType.STRING)
    @Column(name = "input_format_type", nullable = false)
    private InputFormatType inputFormatType;

    @OneToMany(mappedBy = "question", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<TestCase> testCases = new ArrayList<>();

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    public Question() {
        this.createdAt = LocalDateTime.now();
    }

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public Difficulty getDifficulty() {
        return difficulty;
    }

    public void setDifficulty(Difficulty difficulty) {
        this.difficulty = difficulty;
    }

    public InputFormatType getInputFormatType() {
        return inputFormatType;
    }

    public void setInputFormatType(InputFormatType inputFormatType) {
        this.inputFormatType = inputFormatType;
    }

    public List<TestCase> getTestCases() {
        return testCases;
    }

    public void setTestCases(List<TestCase> testCases) {
        this.testCases.clear();
        if (testCases != null) {
            testCases.forEach(tc -> {
                tc.setQuestion(this); // Set the parent question for each test case
                this.testCases.add(tc);
            });
        }
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}
