package com.code.codingplatform.service;

import com.code.codingplatform.model.Question;
import com.code.codingplatform.model.TestCase;
import com.code.codingplatform.repository.QuestionRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
public class QuestionService {

    @Autowired
    private QuestionRepository questionRepository;

    @Transactional
    public Question createQuestion(Question question) {
        // Ensure test cases are linked to the question before saving
        if (question.getTestCases() != null) {
            for (TestCase testCase : question.getTestCases()) {
                testCase.setQuestion(question);
            }
        }
        return questionRepository.save(question);
    }

    public List<Question> getAllQuestions() {
        return questionRepository.findAll();
    }

    public Question getQuestionById(Long id) {
        return questionRepository.findById(id).orElse(null);
    }

    @Transactional
    public Question updateQuestion(Long id, Question updatedQuestion) {
        Optional<Question> existingQuestionOptional = questionRepository.findById(id);
        if (existingQuestionOptional.isPresent()) {
            Question existingQuestion = existingQuestionOptional.get();
            existingQuestion.setTitle(updatedQuestion.getTitle());
            existingQuestion.setDescription(updatedQuestion.getDescription());
            existingQuestion.setDifficulty(updatedQuestion.getDifficulty());
            existingQuestion.setInputFormatType(updatedQuestion.getInputFormatType()); // Update input format

            // Handle test cases: clear existing and add new ones
            existingQuestion.getTestCases().clear(); // Clear existing test cases
            if (updatedQuestion.getTestCases() != null) {
                for (TestCase newTestCase : updatedQuestion.getTestCases()) {
                    newTestCase.setQuestion(existingQuestion); // Link new test cases to the existing question
                    existingQuestion.getTestCases().add(newTestCase);
                }
            }
            return questionRepository.save(existingQuestion);
        }
        return null; // Question not found
    }

    public void deleteQuestion(Long id) {
        questionRepository.deleteById(id);
    }
}
