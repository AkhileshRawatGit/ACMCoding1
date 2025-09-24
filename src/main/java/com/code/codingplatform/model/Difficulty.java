package com.code.codingplatform.model;

public enum Difficulty {
    EASY(2),
    MEDIUM(3),
    HARD(5);

    private final int marksPerTestCase;

    Difficulty(int marksPerTestCase) {
        this.marksPerTestCase = marksPerTestCase;
    }

    public int getMarksPerTestCase() {
        return marksPerTestCase;
    }
}
