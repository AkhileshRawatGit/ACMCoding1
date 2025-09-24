package com.code.codingplatform.Controller;

import com.code.codingplatform.model.Question;
import com.code.codingplatform.service.QuestionService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/questions")
@PreAuthorize("hasAuthority('ADMIN')") // Only ADMIN role can access these endpoints
public class AdminController {

    @Autowired
    private QuestionService questionService;

    @PostMapping
    public ResponseEntity<Question> createQuestion(@RequestBody Question question) {
        try {
            Question createdQuestion = questionService.createQuestion(question);
            return new ResponseEntity<>(createdQuestion, HttpStatus.CREATED);
        } catch (Exception e) {
            // Log the exception for debugging
            System.err.println("Error creating question: " + e.getMessage());
            e.printStackTrace();
            return new ResponseEntity<>(null, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @GetMapping
    public ResponseEntity<List<Question>> getAllQuestions() {
        try {
            List<Question> questions = questionService.getAllQuestions();
            return new ResponseEntity<>(questions, HttpStatus.OK);
        } catch (Exception e) {
            System.err.println("Error getting all questions: " + e.getMessage());
            e.printStackTrace();
            return new ResponseEntity<>(null, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<Question> getQuestionById(@PathVariable Long id) {
        try {
            Question question = questionService.getQuestionById(id);
            if (question != null) {
                return new ResponseEntity<>(question, HttpStatus.OK);
            } else {
                return new ResponseEntity<>(HttpStatus.NOT_FOUND);
            }
        } catch (Exception e) {
            System.err.println("Error getting question by ID: " + e.getMessage());
            e.printStackTrace();
            return new ResponseEntity<>(null, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<Question> updateQuestion(@PathVariable Long id, @RequestBody Question question) {
        try {
            Question updatedQuestion = questionService.updateQuestion(id, question);
            if (updatedQuestion != null) {
                return new ResponseEntity<>(updatedQuestion, HttpStatus.OK);
            } else {
                return new ResponseEntity<>(HttpStatus.NOT_FOUND);
            }
        } catch (Exception e) {
            System.err.println("Error updating question: " + e.getMessage());
            e.printStackTrace();
            return new ResponseEntity<>(null, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<String> deleteQuestion(@PathVariable Long id) {
        try {
            // Check if question exists first
            Question question = questionService.getQuestionById(id);
            if (question == null) {
                return new ResponseEntity<>("Question not found with id: " + id, HttpStatus.NOT_FOUND);
            }

            questionService.deleteQuestion(id);
            return new ResponseEntity<>("Question deleted successfully", HttpStatus.OK);
        } catch (Exception e) {
            System.err.println("Error deleting question with id " + id + ": " + e.getMessage());
            e.printStackTrace();
            return new ResponseEntity<>("Error deleting question: " + e.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
}
