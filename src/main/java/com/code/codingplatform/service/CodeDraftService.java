package com.code.codingplatform.service;

import com.code.codingplatform.model.CodeDraft;
import com.code.codingplatform.model.Question;
import com.code.codingplatform.model.User;
import com.code.codingplatform.payload.response.CodeDraftResponse;
import com.code.codingplatform.repository.CodeDraftRepository;
import com.code.codingplatform.repository.QuestionRepository;
import com.code.codingplatform.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Optional;

@Service
public class CodeDraftService {

    @Autowired
    private CodeDraftRepository codeDraftRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private QuestionRepository questionRepository;

    @Transactional
    public void saveCodeDraft(Long userId, Long questionId, String code, Integer languageId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        Question question = questionRepository.findById(questionId)
                .orElseThrow(() -> new RuntimeException("Question not found"));

        Optional<CodeDraft> existingDraft = codeDraftRepository.findByUserIdAndQuestionId(userId, questionId);

        CodeDraft draft;
        if (existingDraft.isPresent()) {
            draft = existingDraft.get();
            draft.setCode(code);
            draft.setLanguageId(languageId);
            draft.setLastUpdated(LocalDateTime.now());
        } else {
            draft = new CodeDraft();
            draft.setUser(user);
            draft.setQuestion(question);
            draft.setCode(code);
            draft.setLanguageId(languageId);
        }

        codeDraftRepository.save(draft);
    }

    public CodeDraftResponse getCodeDraft(Long userId, Long questionId) {
        Optional<CodeDraft> draft = codeDraftRepository.findByUserIdAndQuestionId(userId, questionId);

        if (draft.isPresent()) {
            CodeDraft codeDraft = draft.get();
            return new CodeDraftResponse(
                    codeDraft.getQuestion().getId(),
                    codeDraft.getCode(),
                    codeDraft.getLanguageId()
            );
        }

        return null;
    }
}
