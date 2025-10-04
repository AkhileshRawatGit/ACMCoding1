#!/bin/bash
# Build script for Render deployment

echo "Starting Maven build..."
mvn clean package -DskipTests

echo "Build completed successfully!"
