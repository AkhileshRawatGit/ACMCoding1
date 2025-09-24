package com.code.codingplatform.security;

import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.util.Date;

@Component
public class JwtTokenProvider {

    private final SecretKey jwtSecret; // Make it final
    private final int jwtExpirationInMs; // Make it final

    // Constructor injection for jwtSecret and jwtExpirationInMs
    public JwtTokenProvider(@Value("${app.jwtSecret}") String jwtSecretString,
                            @Value("${app.jwtExpirationInMs}") int jwtExpirationInMs) {
        // Ensure the secret string is long enough for HS256 (at least 32 bytes for 256 bits)
        // If the string is shorter, it will still throw WeakKeyException.
        // It's best practice to use a Base64 encoded string for the secret.
        // For now, we'll just convert the string to bytes.
        // The previous error was due to Keys.secretKeyFor(SignatureAlgorithm.HS256) generating a new key
        // every time, overriding the @Value injected one.
        // Now, we correctly derive the key from the provided string.
        this.jwtSecret = Keys.hmacShaKeyFor(jwtSecretString.getBytes());
        this.jwtExpirationInMs = jwtExpirationInMs;
    }

    public String generateToken(Authentication authentication) {
        UserPrincipal userPrincipal = (UserPrincipal) authentication.getPrincipal();

        Date now = new Date();
        Date expiryDate = new Date(now.getTime() + jwtExpirationInMs);

        return Jwts.builder()
                .setSubject(Long.toString(userPrincipal.getId()))
                .setIssuedAt(new Date())
                .setExpiration(expiryDate)
                .signWith(jwtSecret, SignatureAlgorithm.HS256) // Specify algorithm explicitly
                .compact();
    }

    public Long getUserIdFromJWT(String token) {
        Claims claims = Jwts.parserBuilder()
                .setSigningKey(jwtSecret)
                .build()
                .parseClaimsJws(token)
                .getBody();

        return Long.parseLong(claims.getSubject());
    }

    public boolean validateToken(String authToken) {
        try {
            Jwts.parserBuilder().setSigningKey(jwtSecret).build().parseClaimsJws(authToken);
            return true;
        } catch (MalformedJwtException ex) {
            // Invalid JWT token
            System.err.println("Invalid JWT token: " + ex.getMessage());
        } catch (ExpiredJwtException ex) {
            // Expired JWT token
            System.err.println("Expired JWT token: " + ex.getMessage());
        } catch (UnsupportedJwtException ex) {
            // Unsupported JWT token
            System.err.println("Unsupported JWT token: " + ex.getMessage());
        } catch (IllegalArgumentException ex) {
            // JWT claims string is empty
            System.err.println("JWT claims string is empty: " + ex.getMessage());
        } catch (io.jsonwebtoken.security.SecurityException ex) { // Catch specific security exception
            System.err.println("JWT signature does not match locally computed signature: " + ex.getMessage());
        }
        return false;
    }
}
