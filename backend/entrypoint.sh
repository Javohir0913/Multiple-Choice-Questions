#!/bin/sh
set -e

# Only the "web" container (backend) runs migrations/seeding, controlled via
# RUN_MIGRATIONS rather than "was a command passed" -- celery-worker and
# celery-beat share this same entrypoint but must never run these steps
# concurrently with backend, or with each other (duplicate-key races on the
# admin seed, competing "alembic upgrade head" runs).
if [ "${RUN_MIGRATIONS:-false}" = "true" ]; then
    echo "Waiting for database migrations..."
    alembic upgrade head

    echo "Seeding admin account..."
    python -m app.db.seed
fi

if [ "$#" -gt 0 ]; then
    echo "Starting: $*"
    exec "$@"
else
    echo "Starting server..."
    exec uvicorn app.main:app --host 0.0.0.0 --port 8000
fi
