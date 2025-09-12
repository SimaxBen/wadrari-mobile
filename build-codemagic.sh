#!/bin/bash

# Codemagic Build Script for Wadrari Mobile App

echo "🚀 Starting Codemagic build for Wadrari..."

# Set environment variables
export NODE_ENV=production
export EXPO_PUBLIC_SUPABASE_URL="https://ozggjrcnkwbodknyrpep.supabase.co"
export EXPO_PUBLIC_SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im96Z2dqcmNua3dib2RrbnlycGVwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY3MzQ5NzQsImV4cCI6MjA3MjMxMDk3NH0.A7qLacSIJeCLFrC6wge6KXgn0QguO50W2yusE9uAXZ0"

# Clean install dependencies
echo "📦 Installing dependencies..."
npm ci

# Fix any dependency issues
echo "🔧 Fixing dependencies..."
npx expo install --fix

# Pre-build tasks
echo "🛠️ Running pre-build tasks..."
npx expo prebuild --platform android --clean

# Build the app
echo "🏗️ Building Android APK..."
cd android
./gradlew assembleRelease

echo "✅ Build completed successfully!"
