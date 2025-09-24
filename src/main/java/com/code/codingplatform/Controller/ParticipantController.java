package com.code.codingplatform.Controller;

import com.code.codingplatform.model.Question;
import com.code.codingplatform.payload.request.CodeExecutionRequest;
import com.code.codingplatform.payload.response.CodeExecutionResponse;
import com.code.codingplatform.service.QuestionService;
import com.code.codingplatform.service.SubmissionService;
import com.code.codingplatform.security.UserPrincipal;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/participant")
@PreAuthorize("hasAuthority('PARTICIPANT')") // Only PARTICIPANT role can access these endpoints
public class ParticipantController {

    @Autowired
    private QuestionService questionService;

    @Autowired
    private SubmissionService submissionService;

    @GetMapping("/questions")
    public ResponseEntity<List<Question>> getAllQuestionsForParticipant() {
        try {
            List<Question> questions = questionService.getAllQuestions();
            return new ResponseEntity<>(questions, HttpStatus.OK);
        } catch (Exception e) {
            System.err.println("Error getting all questions for participant: " + e.getMessage());
            e.printStackTrace();
            return new ResponseEntity<>(null, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @PostMapping("/compile")
    public ResponseEntity<CodeExecutionResponse> compileCode(@AuthenticationPrincipal UserPrincipal currentUser,
                                                             @RequestBody CodeExecutionRequest request) {
        try {
            CodeExecutionResponse response = submissionService.compileCode(request.getQuestionId(), request.getCode(), request.getLanguageId(), currentUser.getId());
            return new ResponseEntity<>(response, HttpStatus.OK);
        } catch (Exception e) {
            System.err.println("Error compiling code: " + e.getMessage());
            e.printStackTrace();
            return new ResponseEntity<>(new CodeExecutionResponse("Error compiling code: " + e.getMessage()), HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @PostMapping("/run")
    public ResponseEntity<CodeExecutionResponse> runCode(@AuthenticationPrincipal UserPrincipal currentUser,
                                                         @RequestBody CodeExecutionRequest request) {
        try {
            CodeExecutionResponse response = submissionService.runCode(request.getQuestionId(), request.getCode(), request.getLanguageId(), currentUser.getId());
            return new ResponseEntity<>(response, HttpStatus.OK);
        } catch (Exception e) {
            System.err.println("Error running code: " + e.getMessage());
            e.printStackTrace();
            return new ResponseEntity<>(new CodeExecutionResponse("Error running code: " + e.getMessage()), HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @PostMapping("/submit")
    public ResponseEntity<CodeExecutionResponse> submitCode(@AuthenticationPrincipal UserPrincipal currentUser,
                                                            @RequestBody CodeExecutionRequest request) {
        try {
            CodeExecutionResponse response = submissionService.submitCode(request.getQuestionId(), request.getCode(), request.getLanguageId(), currentUser.getId());
            return new ResponseEntity<>(response, HttpStatus.OK);
        } catch (Exception e) {
            System.err.println("Error submitting code: " + e.getMessage());
            e.printStackTrace();
            return new ResponseEntity<>(new CodeExecutionResponse("Error submitting code: " + e.getMessage()), HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
}
