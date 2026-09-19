#!/bin/sh
set -e

echo "Waiting for database migrations..."
alembic upgrade head

echo "Seeding admin account..."
python -m app.db.seed

echo "Starting server..."
exec uvicorn app.main:app --host 0.0.0.0 --port 8000
