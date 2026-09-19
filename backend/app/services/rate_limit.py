from fastapi import HTTPException, status

from app.db.redis import redis_client

REGISTER_MAX_ATTEMPTS = 5
REGISTER_WINDOW_SECONDS = 60 * 60  # 1 hour


def check_register_rate_limit(phone: str) -> None:
    key = f"register_attempts:{phone}"
    attempts = redis_client.incr(key)
    if attempts == 1:
        redis_client.expire(key, REGISTER_WINDOW_SECONDS)
    if attempts > REGISTER_MAX_ATTEMPTS:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Juda ko'p urinish. Keyinroq qayta urinib ko'ring.",
        )
