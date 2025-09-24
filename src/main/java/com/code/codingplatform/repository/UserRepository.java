package com.code.codingplatform.repository;

import com.code.codingplatform.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    // This method will find a user by username or email
    Optional<User> findByUsernameOrEmail(String username, String email);

    // This method will find a user by username
    Optional<User> findByUsername(String username);

    // This method will find a user by email
    Optional<User> findByEmail(String email);

    // This method checks if a username exists
    Boolean existsByUsername(String username);

    // This method checks if an email exists
    Boolean existsByEmail(String email);
}
