package com.code.codingplatform.model;

public class TestResult {
    private String input;
    private String expectedOutput;
    private String actualOutput;
    private Boolean passed;
    private String message; // For error messages or specific test case feedback
    private Integer testCaseNumber;

    public TestResult() {}

    public TestResult(String input, String expectedOutput, String actualOutput, Boolean passed, String message) {
        this.input = input;
        this.expectedOutput = expectedOutput;
        this.actualOutput = actualOutput;
        this.passed = passed;
        this.message = message;
    }

    public TestResult(String input, String expectedOutput, String actualOutput, Boolean passed, String message, Integer testCaseNumber) {
        this.input = input;
        this.expectedOutput = expectedOutput;
        this.actualOutput = actualOutput;
        this.passed = passed;
        this.message = message;
        this.testCaseNumber = testCaseNumber;
    }

    // Getters and Setters
    public String getInput() {
        return input;
    }

    public void setInput(String input) {
        this.input = input;
    }

    public String getExpectedOutput() {
        return expectedOutput;
    }

    public void setExpectedOutput(String expectedOutput) {
        this.expectedOutput = expectedOutput;
    }

    public String getActualOutput() {
        return actualOutput;
    }

    public void setActualOutput(String actualOutput) {
        this.actualOutput = actualOutput;
    }

    public Boolean getPassed() {
        return passed;
    }

    public void setPassed(Boolean passed) {
        this.passed = passed;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public Integer getTestCaseNumber() {
        return testCaseNumber;
    }

    public void setTestCaseNumber(Integer testCaseNumber) {
        this.testCaseNumber = testCaseNumber;
    }
}
