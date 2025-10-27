#!/bin/bash
# Load test environment and run migrations

# Export variables from .env.test
export $(grep -v '^#' .env.test | xargs)

# Run migrations
yarn migrate:up
