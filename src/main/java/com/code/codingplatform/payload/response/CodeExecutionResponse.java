package com.code.codingplatform.payload.response;

import com.code.codingplatform.model.TestResult;
import java.util.List;

public class CodeExecutionResponse {
    private String status;
    private String error; // For compilation errors or general execution errors
    private Integer passedTestCases;
    private Integer totalTestCases;
    private Integer obtainedMarks;
    private Integer totalMarks;
    private List<TestResult> testCaseResults;

    public CodeExecutionResponse() {}

    public CodeExecutionResponse(String error) {
        this.status = "ERROR";
        this.error = error;
    }

    // Getters and Setters
    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getError() {
        return error;
    }

    public void setError(String error) {
        this.error = error;
    }

    public Integer getPassedTestCases() {
        return passedTestCases;
    }

    public void setPassedTestCases(Integer passedTestCases) {
        this.passedTestCases = passedTestCases;
    }

    public Integer getTotalTestCases() {
        return totalTestCases;
    }

    public void setTotalTestCases(Integer totalTestCases) {
        this.totalTestCases = totalTestCases;
    }

    public Integer getObtainedMarks() {
        return obtainedMarks;
    }

    public void setObtainedMarks(Integer obtainedMarks) {
        this.obtainedMarks = obtainedMarks;
    }

    public Integer getTotalMarks() {
        return totalMarks;
    }

    public void setTotalMarks(Integer totalMarks) {
        this.totalMarks = totalMarks;
    }

    public List<TestResult> getTestCaseResults() {
        return testCaseResults;
    }

    public void setTestCaseResults(List<TestResult> testCaseResults) {
        this.testCaseResults = testCaseResults;
    }
}
