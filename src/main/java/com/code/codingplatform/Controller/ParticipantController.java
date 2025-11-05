package com.code.codingplatform.Controller;

import com.code.codingplatform.model.Question;
import com.code.codingplatform.payload.request.CodeExecutionRequest;
import com.code.codingplatform.payload.request.SaveCodeDraftRequest;
import com.code.codingplatform.payload.response.CodeDraftResponse;
import com.code.codingplatform.payload.response.CodeExecutionResponse;
import com.code.codingplatform.service.CodeDraftService;
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
import java.util.Map;

@RestController
@RequestMapping("/api/participant")
@PreAuthorize("hasAuthority('PARTICIPANT')")
public class ParticipantController {

    @Autowired
    private QuestionService questionService;

    @Autowired
    private SubmissionService submissionService;

    @Autowired
    private CodeDraftService codeDraftService;

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

    @PostMapping("/save-draft")
    public ResponseEntity<Map<String, String>> saveCodeDraft(@AuthenticationPrincipal UserPrincipal currentUser,
                                                             @RequestBody SaveCodeDraftRequest request) {
        try {
            codeDraftService.saveCodeDraft(currentUser.getId(), request.getQuestionId(),
                    request.getCode(), request.getLanguageId());
            return new ResponseEntity<>(Map.of("message", "Draft saved successfully"), HttpStatus.OK);
        } catch (Exception e) {
            System.err.println("Error saving code draft: " + e.getMessage());
            e.printStackTrace();
            return new ResponseEntity<>(Map.of("message", "Error saving draft: " + e.getMessage()), HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @GetMapping("/get-draft/{questionId}")
    public ResponseEntity<CodeDraftResponse> getCodeDraft(@AuthenticationPrincipal UserPrincipal currentUser,
                                                          @PathVariable Long questionId) {
        try {
            CodeDraftResponse draft = codeDraftService.getCodeDraft(currentUser.getId(), questionId);
            return new ResponseEntity<>(draft, HttpStatus.OK);
        } catch (Exception e) {
            System.err.println("Error getting code draft: " + e.getMessage());
            return new ResponseEntity<>(null, HttpStatus.NOT_FOUND);
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

    @PostMapping("/submit-all")
    public ResponseEntity<Map<String, Object>> submitAll(@AuthenticationPrincipal UserPrincipal currentUser) {
        try {
            Map<String, Object> result = submissionService.submitAllQuestions(currentUser.getId());
            return new ResponseEntity<>(result, HttpStatus.OK);
        } catch (Exception e) {
            System.err.println("Error submitting all: " + e.getMessage());
            e.printStackTrace();
            return new ResponseEntity<>(Map.of("error", "Error submitting all: " + e.getMessage()), HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @GetMapping("/grand-total")
    public ResponseEntity<Map<String, Integer>> getGrandTotal(@AuthenticationPrincipal UserPrincipal currentUser) {
        try {
            Integer grandTotal = submissionService.getGrandTotalScore(currentUser.getId());
            return new ResponseEntity<>(Map.of("grandTotalScore", grandTotal), HttpStatus.OK);
        } catch (Exception e) {
            System.err.println("Error getting grand total: " + e.getMessage());
            return new ResponseEntity<>(Map.of("grandTotalScore", 0), HttpStatus.OK);
        }
    }
}
