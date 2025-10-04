package com.code.codingplatform.payload.response;

public class CodeDraftResponse {
    private Long questionId;
    private String code;
    private Integer languageId;

    public CodeDraftResponse() {
    }

    public CodeDraftResponse(Long questionId, String code, Integer languageId) {
        this.questionId = questionId;
        this.code = code;
        this.languageId = languageId;
    }

    public Long getQuestionId() {
        return questionId;
    }

    public void setQuestionId(Long questionId) {
        this.questionId = questionId;
    }

    public String getCode() {
        return code;
    }

    public void setCode(String code) {
        this.code = code;
    }

    public Integer getLanguageId() {
        return languageId;
    }

    public void setLanguageId(Integer languageId) {
        this.languageId = languageId;
    }
}
