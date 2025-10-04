package com.code.codingplatform.service;

import com.code.codingplatform.model.Question;
import com.code.codingplatform.model.Submission;
import com.code.codingplatform.model.TestCase;
import com.code.codingplatform.model.TestResult;
import com.code.codingplatform.model.User;
import com.code.codingplatform.model.CodeDraft;
import com.code.codingplatform.payload.response.CodeExecutionResponse;
import com.code.codingplatform.repository.QuestionRepository;
import com.code.codingplatform.repository.SubmissionRepository;
import com.code.codingplatform.repository.UserRepository;
import com.code.codingplatform.repository.CodeDraftRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.Base64;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
public class SubmissionService {

    @Autowired
    private QuestionRepository questionRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private SubmissionRepository submissionRepository;

    @Autowired
    private PistonService pistonService;

    @Autowired
    private CodeDraftRepository codeDraftRepository;

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Transactional
    public CodeExecutionResponse compileCode(Long questionId, String code, Integer languageId, Long userId) throws Exception {
        Optional<Question> questionOptional = questionRepository.findById(questionId);
        if (questionOptional.isEmpty()) {
            throw new RuntimeException("Question not found");
        }
        Question question = questionOptional.get();

        List<TestCase> publicTestCases = question.getTestCases().stream()
                .filter(TestCase::getIsPublic)
                .limit(3) // Compile only uses first 3 public tests
                .toList();

        return executeTests(question, code, languageId, userId, publicTestCases, "COMPILE");
    }

    @Transactional
    public CodeExecutionResponse runCode(Long questionId, String code, Integer languageId, Long userId) throws Exception {
        Optional<Question> questionOptional = questionRepository.findById(questionId);
        if (questionOptional.isEmpty()) {
            throw new RuntimeException("Question not found");
        }
        Question question = questionOptional.get();

        // Run uses all test cases (public + private)
        List<TestCase> allTestCases = question.getTestCases();

        return executeTests(question, code, languageId, userId, allTestCases, "RUN");
    }

    @Transactional
    public CodeExecutionResponse submitCode(Long questionId, String code, Integer languageId, Long userId) throws Exception {
        Optional<Question> questionOptional = questionRepository.findById(questionId);
        if (questionOptional.isEmpty()) {
            throw new RuntimeException("Question not found");
        }
        Question question = questionOptional.get();

        List<TestCase> allTestCases = question.getTestCases();

        CodeExecutionResponse response = executeTests(question, code, languageId, userId, allTestCases, "SUBMIT");

        // Save submission details
        Submission submission = new Submission();
        submission.setUser(userRepository.findById(userId).orElseThrow(() -> new RuntimeException("User not found")));
        submission.setQuestion(question);
        submission.setCode(code);
        submission.setLanguageId(languageId);
        submission.setStatus(response.getStatus());
        submission.setPassedTestCases(response.getPassedTestCases());
        submission.setTotalTestCases(response.getTotalTestCases());
        submission.setObtainedMarks(response.getObtainedMarks());
        submission.setTotalMarks(response.getTotalMarks());
        submissionRepository.save(submission);

        updateGrandTotalScore(userId);

        return response;
    }

    @Transactional
    public Map<String, Object> submitAllQuestions(Long userId) throws Exception {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        // Get all code drafts for this user
        List<CodeDraft> drafts = codeDraftRepository.findAll().stream()
                .filter(draft -> draft.getUser().getId().equals(userId))
                .toList();

        List<Map<String, Object>> results = new ArrayList<>();
        int totalScore = 0;

        for (CodeDraft draft : drafts) {
            try {
                CodeExecutionResponse response = submitCode(
                        draft.getQuestion().getId(),
                        draft.getCode(),
                        draft.getLanguageId(),
                        userId
                );

                Map<String, Object> questionResult = new HashMap<>();
                questionResult.put("questionId", draft.getQuestion().getId());
                questionResult.put("questionTitle", draft.getQuestion().getTitle());
                questionResult.put("obtainedMarks", response.getObtainedMarks());
                questionResult.put("totalMarks", response.getTotalMarks());
                questionResult.put("status", response.getStatus());
                results.add(questionResult);

                totalScore += response.getObtainedMarks();
            } catch (Exception e) {
                Map<String, Object> questionResult = new HashMap<>();
                questionResult.put("questionId", draft.getQuestion().getId());
                questionResult.put("questionTitle", draft.getQuestion().getTitle());
                questionResult.put("error", e.getMessage());
                results.add(questionResult);
            }
        }

        Map<String, Object> finalResult = new HashMap<>();
        finalResult.put("results", results);
        finalResult.put("grandTotalScore", getGrandTotalScore(userId));
        finalResult.put("message", "All questions submitted successfully");

        return finalResult;
    }

    @Transactional
    public void updateGrandTotalScore(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        List<Question> allQuestions = questionRepository.findAll();
        int grandTotal = 0;

        // For each question, get the best submission score
        for (Question question : allQuestions) {
            List<Submission> submissions = submissionRepository
                    .findByUserIdAndQuestionIdOrderByObtainedMarksDesc(userId, question.getId());

            if (!submissions.isEmpty()) {
                grandTotal += submissions.get(0).getObtainedMarks();
            }
        }

        user.setGrandTotalScore(grandTotal);
        userRepository.save(user);
    }

    public Integer getGrandTotalScore(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        return user.getGrandTotalScore();
    }

    private CodeExecutionResponse executeTests(Question question, String userCode, Integer languageId, Long userId, List<TestCase> testCasesToExecute, String actionType) throws Exception {
        CodeExecutionResponse response = new CodeExecutionResponse();
        List<TestResult> testResults = new ArrayList<>();
        int passedCount = 0;
        int totalMarks = 0;
        int obtainedMarks = 0;
        int marksPerTestCase = question.getDifficulty().getMarksPerTestCase();

        if (testCasesToExecute.isEmpty()) {
            response.setStatus("SUCCESS");
            response.setPassedTestCases(0);
            response.setTotalTestCases(0);
            response.setObtainedMarks(0);
            response.setTotalMarks(0);
            response.setTestCaseResults(new ArrayList<>());
            return response;
        }

        for (TestCase testCase : testCasesToExecute) {
            String input = testCase.getInput() != null ? testCase.getInput() : "";
            String expectedOutput = testCase.getExpectedOutput();

            // Execute code via Piston
            // 3s run timeout aligned with prior constraints; adjust if needed
            JsonNode resultNode = pistonService.executeCode(userCode, pistonService.mapJudge0LanguageIdToPiston(languageId), input, 3000);

            // Parse compile errors if any
            String compileMsg = "";
            boolean hasCompile = resultNode.has("compile") && !resultNode.get("compile").isNull();
            if (hasCompile) {
                JsonNode compile = resultNode.get("compile");
                int ccode = compile.path("code").asInt(0);
                if (ccode != 0) {
                    String cOut = compile.path("output").asText("");
                    String cErr = compile.path("stderr").asText("");
                    compileMsg = (cOut + (cErr.isEmpty() ? "" : ("\n" + cErr))).trim();
                    String message = "Compilation Error: " + compileMsg;

                    // mark and potentially early-return for COMPILE action (parity with old behavior)
                    testResults.add(new TestResult(input, expectedOutput, "", false, message));
                    response.setStatus("COMPILATION_ERROR");
                    response.setError(message);
                    response.setTestCaseResults(testResults);
                    response.setPassedTestCases(passedCount);
                    response.setTotalTestCases(testCasesToExecute.size());
                    response.setObtainedMarks(obtainedMarks);
                    response.setTotalMarks(testCasesToExecute.size() * marksPerTestCase);
                    if (actionType.equals("COMPILE")) {
                        return response;
                    } else {
                        // For RUN/SUBMIT, continue to next test case (as prior code shows all errors)
                        totalMarks += marksPerTestCase;
                        continue;
                    }
                }
            }

            JsonNode run = resultNode.path("run");
            String stdout = run.path("stdout").asText("");
            String stderr = run.path("stderr").asText("");
            int exitCode = run.path("code").asInt(0);
            String signal = run.path("signal").asText("");

            boolean passed = false;
            String message = "";

            if (exitCode == 0) {
                if (stdout.trim().equals(expectedOutput.trim())) {
                    passed = true;
                    passedCount++;
                    obtainedMarks += marksPerTestCase;
                    message = "Passed";
                } else {
                    message = "Wrong Answer";
                }
            } else {
                // Try to categorize common cases for clarity
                if ("SIGKILL".equalsIgnoreCase(signal)) {
                    message = "Time Limit Exceeded: " + (stderr.isEmpty() ? stdout : stderr);
                } else {
                    message = "Runtime Error: " + (stderr.isEmpty() ? stdout : stderr);
                }
            }

            totalMarks += marksPerTestCase;

            boolean showDetails = testCase.getIsPublic() || actionType.equals("RUN") || actionType.equals("SUBMIT");
            testResults.add(new TestResult(
                    showDetails ? input : "Hidden",
                    showDetails ? expectedOutput : "Hidden",
                    showDetails ? stdout : "Hidden",
                    passed,
                    message
            ));
        }

        response.setStatus(passedCount == testCasesToExecute.size() ? "ACCEPTED" : "WRONG_ANSWER");
        response.setPassedTestCases(passedCount);
        response.setTotalTestCases(testCasesToExecute.size());
        response.setObtainedMarks(obtainedMarks);
        response.setTotalMarks(totalMarks);
        response.setTestCaseResults(testResults);

        if (response.getStatus().equals("WRONG_ANSWER") && response.getError() == null) {
            response.setError("Some test cases failed.");
        }

        return response;
    }
}
