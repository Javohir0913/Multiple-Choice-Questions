"""Seeds the admin account from environment variables on every startup.

The admin's phone/password live in .env (ADMIN_PHONE / ADMIN_PASSWORD).
The password is hashed with bcrypt before being stored — it is never kept
in plain text. If the admin already exists, its password hash is kept in
sync with the current .env value.
"""
from app.core.config import settings
from app.core.security import hash_password
from app.db.session import SessionLocal
from app.models.user import User


def seed_admin() -> None:
    db = SessionLocal()
    try:
        admin = db.query(User).filter(User.phone == settings.ADMIN_PHONE).first()
        hashed = hash_password(settings.ADMIN_PASSWORD)
        if admin is None:
            admin = User(
                first_name="Admin",
                last_name="",
                phone=settings.ADMIN_PHONE,
                password_hash=hashed,
                is_admin=True,
                is_active=True,
            )
            db.add(admin)
        else:
            admin.password_hash = hashed
            admin.is_admin = True
            admin.is_active = True
        db.commit()
    finally:
        db.close()


if __name__ == "__main__":
    seed_admin()
