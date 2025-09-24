# Use official OpenJDK image
FROM openjdk:17-jdk-slim

# Create app directory
WORKDIR /app

# Copy pom.xml and download dependencies
COPY pom.xml .

RUN apt-get update && apt-get install -y maven
RUN mvn dependency:go-offline

# Copy entire project
COPY . .

# Package the application
RUN mvn clean package -DskipTests

# Expose port
EXPOSE 8080

# Run the JAR file
CMD ["java", "-jar", "target/acmcoding-0.0.1-SNAPSHOT.jar"]
